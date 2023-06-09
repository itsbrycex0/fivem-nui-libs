// src/xnets.js
'use strict';

/**
 * 
 * @var {Object} states - ตัวแปรสำหรับการเก็บข้อมูล states
 */
const states = {};
/**
 * 
 * @var {Object} renderers - ตัวแปรสำหรับการเก็บข้อมูล state re-render
 */
const renderers = {};
/**
 * 
 * @var {Object} listeners - ตัวแปรสำหรับการเก็บข้อมูล listener จากฝั่ง client
 */
const listeners = {};


/**
 * ฟังก์ชั่นที่ใช้สำหรับการ `Render` หน้าเว็บเมื่อมีการอัพเดต `State` หนึ่งครั้ง
 * 
 * @param {string} name - ชื่อของ State ที่สร้างเมื่อใช้งานฟังก์ชั่น useState
 * @param {any} value - ค่าของ State ที่จะเปลี่ยนบนหน้าเว็บไซต์
 * @returns void
 */
function rerender(name, value) {
    renderers[name].element.forEach(element => element.innerHTML = value);
    queryStatement(name);
}

/**
 * เป็นฟังก์ชั่นที่สร้างขึ้นมาเพื่อรองรับในการใช้ `Attribute` **show-on** เนื่องจาก Parameter แรกคือชื่อของ State และส่วนที่สองคือ Operator ในการตรวจสอบ
 * และส่วนสุดท้ายคือข้อมูล ซึ่งเราสามารถเรียกใช้ฟังก์ชั่น `getStateValue` ในการดึง State มาตรวจสอบด้วยกันได้
 * 
 * @example <div show-on="counter equal getStateValue('counter2')">
 * จากตัวอย่างเป็นการตรวจสอบ State counter และ State counter2 ว่ามีจำนวนเท่ากันหรือไม่
 * 
 * @param {string} name - ชื่อของ State ที่คุณต้องการเรียกใช้
 * @returns void
 */
function getStateValue(name) {
    if(name in renderers) {
        return renderers[name].getState();
    }
}

/**
 * ฟังก์ชั่นสำหรับการตรวจสอบเงื่อนไข `Attribute` **show-on** เมื่อมีการเปลี่ยนแปลงค่า State บนเว็บไซต์
 * เพื่อให้มีการ `Re-Render Component` แบบ Real-Time ณ ขณะนั้น
 * 
 * @param {string} name - ชื่อของ State ที่ต้องการเช็ค
 * @returns void
 */
function queryStatement(name) {
    renderers[name].statement.forEach(element => {
        let args = element.getAttribute('show-on').split(' ');
        let classToShow = element.getAttribute('show-class');
        let classToHide = element.getAttribute('hide-class');
        let stateValue = renderers[name].getState();

        if((typeof stateValue === 'string' && stateValue.length > 0) || stateValue > 0) {
            let operator = args[1];
            let targetValue = args[2];
            let template = `${stateValue} ${operator === 'equal' ? '==' : '!='} ${targetValue}`;
            let output = eval(template);

            if(output === true) {
                element.classList.add(classToShow);
                element.classList.remove(classToHide);
            } else {
                element.classList.add(classToHide);
                element.classList.remove(classToShow);
            }
        }
    });
}


/**
 * ฟังก์ชั่นสำหรับการเพิ่มฟังก์ชั่นในฝั่งของ `Xnets Client` ทำขึ้นมาเพื่อใช้งานกับ `Attribute` `data-xnets-click`
 * 
 * @param {string} name - ชื่อฟังก์ชั่นที่คุณต้องการตั้ง
 * @param {Function} cb - เป็นฟังก์ชั่นที่จะถูกเรียกใช้เมื่อมีการเรียกใช้
 * @returns void
 */
export function addFunction(name, cb) {
    window[name] = cb;
}

/**
 * @typedef {Object} XnetsAddFunction
 * @property {string} name - ชื่อฟังก์ชั่นที่คุณต้องการตั้ง
 * @property {Function} execute - เป็นฟังก์ชั่นที่จะถูกเรียกใช้เมื่อมีการเรียกใช้
 */

/**
 * ฟังก์ชั่นสำหรับการเพิ่มฟังก์ชั่นในฝั่งของ `Xnets Client` ทำขึ้นมาเพื่อใช้งานกับ `Attribute` `data-xnets-click`
 * 
 * @param {Array<XnetsAddFunction>} list - รวมฟังก์ชั่นที่ต้องการสร้างเพิ่มมาเพิ่มในฟังก์ชั่นเดียว
 * @returns void
 */
export function addFunctions(list) {
    for(const name in list) {
        addFunction(list[name].name, list[name].execute);
    }
}

/**
 * @typedef XnetsState
 * @property {any} value - ค่าเริ่มต้นที่คุณตั้งจากการใช้ `useState`
 * @property {Function} setter - ฟังก์ชั่นสำหรับเปลี่ยนแปลงค่า State
 */

/**
 * ฟังก์ชั่นสำหรับการใช้งาน State | State คือตัวแปรที่เมื่อไหร่ที่ถูกเปลี่ยนแปลง หน้าเว็บไซต์จะมีการอัพเดตทันทีในรูปแบบ Real-Time
 * 
 * @param {any} defValue - ค่าเริ่มต้นของ State นั้น ๆ
 * @param {string?} name - กำหนดชื่อเพื่อใช้งานคู่กับ `Xnets Ref`
 * @returns {XnetsState}
 */
export function useState(defValue, name = false) {
    let stateName = Object.keys(states) + 1;

    states['_' + stateName] = defValue;
    Object.defineProperty(states, stateName, {
        set: function(value) {
            this['_' + stateName] = value;
            if(name in renderers) {
                rerender(name, value);
            }
        },

        get: function() {
            return this['_' + stateName];
        }
    });

    const getter = () => states[stateName];

    const setter = (newValue) => {
        states[stateName] = newValue;
    };

    if(name) {
        renderers[name] = {
            element: document.querySelectorAll(`[data-xnets="${name}"]`),
            state: stateName,
            setState: setter,
            getState: getter,
            statement: []
        };

        rerender(name, defValue);
    }

    return [
        getter,
        setter
    ];
}

/**
 * เพิ่ม `Listener` ในการติดต่อสื่อสารกับฝั่ง `Client` ของตัวเกม
 * 
 * @param {string} type - ประเภทของ `Event` ที่ต้องการสื่อสารกับฝั่ง `Client`
 * @param {Function} cb - ฟังก์ชั่นที่จะเรียกใช้
 * @returns void
 */
export function addListener(type, cb) {
    if(type in listeners) {
        throw `FIVEM-NUI-LIB : Cannot add one more event of ${type} because it is already exists!`;
    }

    listeners[type] = cb;
}

/**
 * ฟังก์ชั่นสำหรับการส่งข้อมูลจาก `Javascript` ไปยังฝั่ง `Client` หรือ **ผู้เล่น**
 * 
 * @param {string} endpoint - URL ของ Script ที่จะทำการสื่อสารเช่น `https://xnets/check `
 * @param {Object?} data - ข้อมูลที่จะทำการส่งคืนกลับไปให้ `Client`
 */
export function communicate(endpoint, data = {}) {
    navigator.sendBeacon(endpoint, JSON.stringify(data));
}

/**
 * 
 * 
 * Window Events
 * 
 * 
 */

window.addEventListener('message', e => {
    let data = e.data;
    if('type' in data) {
        let type = data.type;

        if(type in listeners) {
            listeners[type](data);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        let onClickElements = document.querySelectorAll('[data-xnets-click]');
        onClickElements.forEach(element => element.addEventListener('click', (e) => {
            let cbString = e.currentTarget.getAttribute('data-xnets-click');
            eval(cbString);
        }));

        let refElements = document.querySelectorAll('input[data-xnets-ref]');
        refElements.forEach(element => element.addEventListener('keyup', (e) => {
            let newValue = e.currentTarget.value;
            let refTarget = e.currentTarget.getAttribute('data-xnets-ref');
            if(refTarget in renderers) {
                let data = renderers[refTarget];
                data.setState(newValue);
            }
        }));

        let showOnElements = document.querySelectorAll('[show-on]');
        showOnElements.forEach(element => {
            let args = element.getAttribute('show-on').split(' ');
            let stateName = args[0];
            if(stateName in renderers) {
                renderers[stateName].statement.push(element);
            }
        });

        for(const index in renderers) {
            queryStatement(index);
        }
    }, 0);
});
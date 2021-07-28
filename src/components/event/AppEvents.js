
const events = {};
export default class AppEvents {
    static addEventListener(eventName, callback) {
        if(!events[eventName])
            events[eventName] = [];
        const eventList = events[eventName];
        if(eventList.includes(callback)) {
            console.warn("Callback already exists for event ", eventName, callback);
        } else {
            eventList.push(callback)
        }
    }

    static removeEventListener(eventName, callback) {
        const eventList = events[eventName];
        if(eventList) {
            const i = eventList.indexOf(callback);
            if(i !== -1) {
                eventList.splice(i, 1);
            }
        }
    }

    static emit(eventName, e=null) {
        const eventList = events[eventName];
        if(eventList) {
            for(const callback of eventList) {
                callback(e);
            }
        }
    }
}
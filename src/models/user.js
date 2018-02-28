const _ = require('underscore');

const Base = require('./base');

/**
 * owner model
 */
class user extends Base {
    constructor(config, data = {}) {
        super(config);
        this.data = {};
    }

    make(username) {
    	let promise = this.get(`users?username=${username}`);

    	promise.then((userdata) => {
    		this.data = userdata.body;
    		return promise;
    	});

    	return promise;
    }

    get id() {
    	return this.data.id;
    }

    get name() {
    	return this.data.name;
    }

    get username() {
    	return this.data.username;
    }
}

module.exports = user;
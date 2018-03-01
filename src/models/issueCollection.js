const _ = require('underscore');

const Base = require('./base');
const Issue = require('./issue');

class issueCollection extends Base {
	constructor(config) {
		super(config);

		this.config = config;
		this.issues = [];

		this._state = `opened`;
		this._scope = `assigned-to-me`;
	}

	all(username, state = this._state, scope = this._scope) {
		return new Promise((resolve, reject) => {
			super.all(`issues?state=${this._state}&scope=${this._scope}&assignee_id=${username}`)
				.then((issues_collected) => {
					_.each(issues_collected, (issue_raw) => {
						let issue = new Issue(this.config, issue_raw);
						this.issues.push(issue);
					});
					resolve(this.issues);
				});
		});
	}
}

module.exports = issueCollection;
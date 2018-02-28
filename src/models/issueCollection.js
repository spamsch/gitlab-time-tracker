const _ = require('underscore');

const Base = require('./base');
const Issue = require('./issue');

class issueCollection extends Base {
	constructor(config) {
		super(config);

		this._config = config;
		this._issues = [];

		this._state = `opened`;
		this._scope = `assigned-to-me`;

	}

	all(username, state = this._state, scope = this._scope) {
		return new Promise((resolve, reject) => {
			super.all(`issues?state=${this._state}&scope=${this._scope}`)
				.then((issues_collected) => {
					_.each(issues_collected, (issue_raw) => {
						let issue = new Issue(this._config, issue_raw);
						this._issues.push(issue);
					});
					resolve(this._issues);
				});
		});
	}
}

module.exports = issueCollection;
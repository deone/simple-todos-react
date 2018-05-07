/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Accounts } from 'meteor/accounts-base';

import { Tasks } from './tasks.js';

if (Meteor.isServer) {
  /* describe('Array', function() {
    describe('#indexOf()', function() {
      it('should return -1 when the value is not present', function() {
        assert.equal([1,2,3].indexOf(4), -1);
      });
    });
  }); */

  describe('Tasks', function() {
    describe('methods', function() {
      // const userId = Random.id();
      // let taskId;

      const username = 'deone';
      let taskId, userId;

      before(function() {
        // Create user if not already created.
        userId = Meteor.users.findOne({username: username})._id;
        if (!userId) {
          userId = Accounts.createUser({
            'username': username,
            'email': 'a@a.com',
            'password': '12345578',
          }); 
        }
      });

      beforeEach(function() {
        Tasks.remove({});
        taskId = Tasks.insert({
          text: 'test task',
          createdAt: new Date(),
          owner: userId,
          username: 'tmeasday',
        });
      });

      it('can delete own task', function() {
        // Find the internal implementation of the task method so we can
        // test it in isolation
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];

        // Set up a fake method invocation that looks like what the method expects
        const invocation = { userId };

        // Run the method with `this` set to the fake invocation
        deleteTask.apply(invocation, [taskId]);

        // Verify that the method does what we expected
        assert.equal(Tasks.find().count(), 0);
      });

      /* Classwork */
      it('can set own task private', function() {
        const setTaskPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
        const invocation = { userId };
        setTaskPrivate.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({private: true}).count(), 1);
      });

      it('can set own task checked', function() {
        const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
        const invocation = { userId };
        setChecked.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({checked: true}).count(), 1);
      });

      it('can insert task', function() {
        let text = 'Hello!';
        const insert = Meteor.server.method_handlers['tasks.insert'];
        const invocation = { userId };
        insert.apply(invocation, [text]);
        assert.equal(Tasks.find().count(), 2);
      });
    });
  });
}
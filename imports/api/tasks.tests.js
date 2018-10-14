/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'chai';
import { Accounts } from 'meteor/accounts-base';

import { Tasks } from './tasks.js';

if (Meteor.isServer) {
  describe('Tasks', function() {
    describe('methods', function() {
      const username = 'deone';
      let taskId, userId;

      before(function() {
        // Create user if not already created.
        let user = Meteor.users.findOne({username: username});
        if (!user) {
          userId = Accounts.createUser({
            'username': username,
            'email': 'a@a.com',
            'password': '12345578',
          }); 
        } else {
          userId = user._id;
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

      // Insert
      it('can insert task', function() {
        let text = 'Hello!';
        const insert = Meteor.server.method_handlers['tasks.insert'];
        const invocation = { userId };
        insert.apply(invocation, [text]);
        assert.equal(Tasks.find().count(), 2);
      });

      it('cannot insert task if not logged in', function() {
        let text = 'Hi!';

        const insert = Meteor.server.method_handlers['tasks.insert'];

        // No userId passed into fake method invocation
        const invocation = {};

        assert.throws(function() {
          insert.apply(invocation, [text]);
        }, Meteor.Error, /not-authorized/);

        assert.equal(Tasks.find().count(), 1);
      });

      // Remove
      // Do this, give rest as classwork
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

      it("cannot delete someone else's task", function() {
        // Set task to private
        Tasks.update(taskId, { $set: { private: true } });

        // Generate a random ID, representing a different user
        const userId = Random.id();

        const deleteTask = Meteor.server.method_handlers['tasks.remove'];
        const invocation = { userId };

        // Verify that error is thrown
        // - https://stackoverflow.com/questions/43336212/how-to-expect-a-meteor-error-with-chai
        assert.throws(function() {
          deleteTask.apply(invocation, [taskId]);
        }, Meteor.Error, /not-authorized/);

        // Verify that task is not deleted
        assert.equal(Tasks.find().count(), 1);
      });

      // Set task checked
      it('can set own task checked', function() {
        const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
        const invocation = { userId };
        setChecked.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({checked: true}).count(), 1);
      });

      it("cannot set someone else's task checked", function() {
        // Set task to private
        Tasks.update(taskId, { $set: { private: true } });

        // Generate a random ID, representing a different user
        const userId = Random.id();

        const setChecked = Meteor.server.method_handlers['tasks.setChecked'];
        const invocation = { userId };

        // Verify that error is thrown
        // - https://stackoverflow.com/questions/43336212/how-to-expect-a-meteor-error-with-chai
        assert.throws(function() {
          setChecked.apply(invocation, [taskId, true]);
        }, Meteor.Error, /not-authorized/);

        // Verify that task is not set checked
        assert.equal(Tasks.find({checked: true}).count(), 0);
      });

      // Set task private
      it('can set own task private', function() {
        const setTaskPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
        const invocation = { userId };
        setTaskPrivate.apply(invocation, [taskId, true]);
        assert.equal(Tasks.find({private: true}).count(), 1);
      });

      it("cannot set someone else's task private", function() {
        // Generate a random ID, representing a different user
        const userId = Random.id();

        const setPrivate = Meteor.server.method_handlers['tasks.setPrivate'];
        const invocation = { userId };

        // Verify that error is thrown
        // - https://stackoverflow.com/questions/43336212/how-to-expect-a-meteor-error-with-chai
        assert.throws(function() {
          setPrivate.apply(invocation, [taskId, true]);
        }, Meteor.Error, /not-authorized/);

        // Verify that task is not set private
        assert.equal(Tasks.find({private: true}).count(), 0);
      });
    });
  });
}
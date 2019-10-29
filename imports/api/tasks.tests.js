/* eslint-env mocha */

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { assert } from 'chai'
import { Accounts } from 'meteor/accounts-base'

import { Tasks } from './tasks.js'

if (Meteor.isServer) {
  describe('Simple Todos Unit Tests', () => {
    describe('Meteor Methods', () => {
      const username = 'deone'
      let taskId, userId

      before(() => {
        // Create user if not already created.
        let user = Meteor.users.findOne({username: username})
        if (!user) {
          userId = Accounts.createUser({
            'username': username,
            'email': 'a@a.com',
            'password': '12345578',
          })
        } else {
          userId = user._id
        }
      })

      beforeEach(() => {
        taskId = Tasks.insert({
          text: 'test task',
          createdAt: new Date(),
          owner: userId,
          username: 'tmeasday',
        })
      })

      afterEach(() => {
        Tasks.remove({})
      })

      // Insert
      it('can insert task', () => {
        const text = 'Hello!'

        const insert = Meteor.server.method_handlers['tasks.insert']
        const invocation = { userId }

        insert.apply(invocation, [text])

        assert.strictEqual(Tasks.find().count(), 2)
      })

      it('cannot insert task if not logged in', () => {
        const text = 'Hi!'

        const insert = Meteor.server.method_handlers['tasks.insert']

        // No userId passed into fake method invocation
        const invocation = {}

        assert.throws(() => insert.apply(invocation, [text]),
          Meteor.Error, '[You are not allowed to insert without logging in]')

        assert.strictEqual(Tasks.find().count(), 1)
      })

      // Remove
      // Do this, give rest as classwork
      it('can delete own task', () => {
        // Find the internal implementation of the task method so we can
        // test it in isolation
        const deleteTask = Meteor.server.method_handlers['tasks.remove']

        // Set up a fake method invocation that looks like what the method expects
        const invocation = { userId }

        // Run the method with `this` set to the fake invocation
        deleteTask.apply(invocation, [taskId])

        // Verify that the method does what we expected
        assert.strictEqual(Tasks.find().count(), 0)
      })

      it("cannot delete someone else's task", () => {
        // Set task to private
        Tasks.update(taskId, { $set: { private: true } })

        // Generate a random ID, representing a different user
        const userId = Random.id()

        const deleteTask = Meteor.server.method_handlers['tasks.remove']
        const invocation = { userId }

        // Verify that error is thrown
        assert.throws(() => deleteTask.apply(invocation, [taskId]),
          Meteor.Error, "[You are not allowed to deleted someone else's task]")

        // Verify that task is not deleted
        assert.strictEqual(Tasks.find().count(), 1)
      })

      // Set task checked
      it('can set own task checked', () => {
        const setChecked = Meteor.server.method_handlers['tasks.setChecked']

        const invocation = { userId }
        setChecked.apply(invocation, [taskId, true])

        assert.strictEqual(Tasks.find({checked: true}).count(), 1)
      })

      it("cannot set someone else's task checked", () => {
        // Set task to private
        Tasks.update(taskId, { $set: { private: true } })

        // Generate a random ID, representing a different user
        const userId = Random.id()

        const setChecked = Meteor.server.method_handlers['tasks.setChecked']
        const invocation = { userId }

        // Verify that error is thrown
        assert.throws(() => setChecked.apply(invocation, [taskId, true]),
          Meteor.Error, "[You are not allowed to check off someone else's task]")

        // Verify that task is not set checked
        assert.strictEqual(Tasks.find({checked: true}).count(), 0)
      })

      // Set task private
      it('can set own task private', () => {
        const setTaskPrivate = Meteor.server.method_handlers['tasks.setPrivate']

        const invocation = { userId }
        setTaskPrivate.apply(invocation, [taskId, true])

        assert.strictEqual(Tasks.find({private: true}).count(), 1)
      })

      it("cannot set someone else's task private", () => {
        // Generate a random ID, representing a different user
        const userId = Random.id()

        const setPrivate = Meteor.server.method_handlers['tasks.setPrivate']
        const invocation = { userId }

        // Verify that error is thrown
        assert.throws(() => setPrivate.apply(invocation, [taskId, true]),
          Meteor.Error, "[You are not allowed to set someone else's task as private]")

        // Verify that task is not set private
        assert.strictEqual(Tasks.find({private: true}).count(), 0)
      })

      it('can view own task and non-private tasks', () => {
        const userId = Random.id()
        Tasks.insert({
          text: 'test task 2',
          createdAt: new Date(),
          owner: userId,
          username: 'eugene'
        })

        const invocation = { userId }
        const tasksPublication = Meteor.server.publish_handlers['tasks']

        assert.strictEqual(tasksPublication.apply(invocation).count(), 2)
      })

    })
  })
}
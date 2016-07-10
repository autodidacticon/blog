import { Mongo } from 'meteor/mongo';

export const Posts = new Mongo.Collection('posts');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('posts', function postsPublication() {
    return Posts.find();
  });
}

export class Post {
  constructor(title, date, comments, categories, body) {
    this.title = title;
    this.date = date;
    this.comments = comments;
    this.categories = categories;
    this.body = body;
    this.dateString = new Date(date).toDateString();
  }
};

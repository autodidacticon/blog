import { Meteor } from 'meteor/meteor';
import { Posts, Post } from '../imports/api/posts.js';
import { fs } from 'fs';
import '../imports/api/posts.js';

const postsDir = 'posts';
const postsManifest = `${postsDir}/manifest`;
const filePattern = /(\d{4}-\d{2}-\d{2})-([\w-\d]+)\.(?:markdown|md)/;
const fm = require('front-matter');

Meteor.startup(() => {
  Posts.remove({});
  Assets.getText(postsManifest)
    .split("\n")
    .filter((f) => f.match(filePattern) != null)
    .map((f) => {
      let post = fm(Assets.getText(postsDir + '/' + f));
      Posts.insert(
        new Post(
          post.attributes.title,
          post.attributes.date,
          post.attributes.comments,
          post.attributes.categories,
          post.body
        ));
    });
});


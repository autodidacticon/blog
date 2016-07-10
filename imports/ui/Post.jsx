import React, { Component, PropTypes } from 'react';

// Task component - represents a single todo item
export default class Post extends Component {
  render() {
    let post = this.props.post;
    return (
      <div class="post">
        <h3>{post.title}</h3>
        <h4>{post.dateString}</h4>
        <article>
          <Markdown>
          {post.body}
          </Markdown>
        </article>
      </div>
    );
  }
}

Post.propTypes = {
  // This component gets the task to display through a React prop.
  // We can use propTypes to indicate it is required
  post: PropTypes.object.isRequired,
};

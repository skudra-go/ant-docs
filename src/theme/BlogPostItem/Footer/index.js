import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import {StarBox} from '@site/src/components/StarOnGitHub';

// Every post ends with a request for a star. The blog's list of posts doesn't.
export default function FooterWrapper(props) {
  const {isBlogPostPage} = useBlogPost();

  return (
    <>
      {isBlogPostPage && (
        <StarBox
          text="ant is open source. If this was interesting, a star on GitHub helps other Go developers find it."
          next={{to: '/quick-start', label: 'Quick start'}}
        />
      )}
      <Footer {...props} />
    </>
  );
}

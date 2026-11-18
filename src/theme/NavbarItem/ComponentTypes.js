import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import {StarNavbarItem} from '@site/src/components/StarOnGitHub';

// type: 'custom-star' in the navbar config is the star button.
export default {
  ...ComponentTypes,
  'custom-star': StarNavbarItem,
};

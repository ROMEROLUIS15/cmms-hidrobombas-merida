const React = require('react');
const reactRouterDom = jest.requireActual('react-router-dom');
module.exports = {
  ...reactRouterDom,
  Link: ({ children, to, ...props }) =>
    React.createElement('a', { href: to, ...props }, children),
};

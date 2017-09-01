import React from 'react';
import Popup from 'react-popup';

import { Prompt } from './prompt-component/prompt-component';

import './popup-component.css'

Popup.registerPlugin('promptProcess', function (defaultValue, placeholder, callback) {
  let promptValue = null;
  let promptChange = function (value) {
    promptValue = value;
  };

  this.create({
    title: "Create New Process",
    content: <Prompt onChange={promptChange} placeholder={placeholder} value={defaultValue} />,
    buttons: {
      left: ["cancel"],
      right: [{
        text: "Save",
        className: "success",
        action: function() {
          callback(promptValue);
          Popup.close();
        }
      }]
    }
  });
});

Popup.registerPlugin('promptStock', function (defaultValue, placeholder, callback) {
  let promptValue = null;
  let promptChange = function (value) {
    promptValue = value;
  };

  this.create({
    title: "Create New Stock",
    content: <Prompt onChange={promptChange} placeholder={placeholder} value={defaultValue} />,
    buttons: {
      left: ["cancel"],
      right: [{
        text: "Save",
        className: "success",
        action: function() {
          callback(promptValue);
          Popup.close();
        }
      }]
    }
  });
});

Popup.registerPlugin('promptLink', function (defaultValue, placeholder, callback) {
  let promptValue = null;
  let promptChange = function (value) {
    promptValue = value;
  };

  this.create({
    title: "Create New Flow",
    content: <Prompt onChange={promptChange} placeholder={placeholder} value={defaultValue} />,
    buttons: {
      left: ["cancel"],
      right: [{
        text: "Save",
        className: "success",
        action: function() {
          callback(promptValue);
          Popup.close();
        }
      }]
    }
  });
});

Popup.registerPlugin('noticeOkCancel', function (noticeHeading, noticeText, buttonText, callback) {
  this.create({
    title: noticeHeading,
    content: noticeText,
    buttons: {
      left: ["cancel"],
      right: [{
        text: buttonText,
        className: "danger",
        action: function() {
            callback();
            Popup.close();
          }
        }]
    }
  });
});

Popup.registerPlugin('noticeCancel', function (noticeHeading, noticeText, callback) {
  this.create({
    title: noticeHeading,
    content: noticeText,
    buttons: {
      right: ["cancel"],
    }
  });
});

export default Popup;

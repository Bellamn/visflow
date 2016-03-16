/**
 * @fileoverview Visflow user login and registration.
 */

/** @const */
visflow.user = {};

/**
 * Login account information.
 * @type {?{
 *   username: string
 * }}
 */
visflow.user.account = null;

/** @private @const {string} */
visflow.user.REGISTER_TEMPLATE_ = './dist/html/user/register-dialog.html';
/** @private @const {string} */
visflow.user.LOGIN_TEMPLATE_ = './dist/html/user/login-dialog.html';
/** @private @const {string} */
visflow.user.PROFILE_TEMPLATE_ = './dist/html/user/profile-dialog.html';

/** @private @const {string} */
visflow.user.REGISTER_URL_ = './server/register.php';
/** @private @const {string} */
visflow.user.LOGIN_URL_ = './server/login.php';
/** @private @const {string} */
visflow.user.LOGOUT_URL_ = './server/logout.php';
/** @private @const {string} */
visflow.user.AUTH_URL_ = './server/auth.php';

/** @private @const {string} */
visflow.user.USERNAME_REGEX_ = '[a-z0-9_]+';
/** @private @const {string} */
visflow.user.EMAIL_REGEX_ =
  '^(([^<>()[\\]\\\\.,;:\\s@"]+(\\.[^<>()[\\]\\\\.,;:\\s@"]+)' +
  '*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|' +
  '(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';

/** @private @const {number} */
visflow.user.MIN_USERNAME_LENGTH_ = 6;

/** @private @const {number} */
visflow.user.MIN_PASSWORD_LENGTH_ = 8;

/**
 * Callback function that will be called after the user logs in.
 * @type {?function()}
 */
visflow.user.loginHook = function() {
  if (visflow.user.loggedIn()) {
    var diagram = location.search.split('diagram=')[1];
    if (diagram !== undefined) {
      visflow.diagram.download(diagram);
    }
  } else {
    visflow.welcome.init();
  }
};

/**
 * Initializes user settings.
 */
visflow.user.init = function() {
  visflow.user.authenticate();
};

/**
 * Shows a registration dialog.
 */
visflow.user.register = function() {
  visflow.dialog.create({
    template: visflow.user.REGISTER_TEMPLATE_,
    complete: visflow.user.registerDialog_
  });
};

/**
 * Shows a login dialog.
 * @param {string=} message
 */
visflow.user.login = function(message) {
  visflow.dialog.create({
    template: visflow.user.LOGIN_TEMPLATE_,
    complete: visflow.user.loginDialog_,
    params: {
      message: message
    }
  });
};

/**
 * Logins in the demo account.
 */
visflow.user.loginDemo = function() {
  $.post(visflow.user.LOGIN_URL_, {
    username: 'demo',
    password: 'demo'
  }).done(function() {
    visflow.dialog.close();
    visflow.success('working in demo mode');
    visflow.user.authenticate();
  }).fail(function(res) {
    visflow.error(res.responseText);
  });
};

/**
 * Shows the user profile dialog.
 */
visflow.user.profile = function() {
  // TODO(bowen): add user profile edit
  /*
  visflow.dialog.create({
    template: visflow.user.PROFILE_TEMPLATE_,
    complete: visflow.user.profileDialog_
  });
  */
};

/**
 * Checks whether the user has logged in.
 * @return {boolean}
 */
visflow.user.loggedIn = function() {
  return visflow.user.account != null;
};

/**
 * Checks whether the user can upload data or save diagram.
 * @return {boolean}
 */
visflow.user.writePermission = function() {
  return visflow.user.loggedIn();//&& visflow.user.account.username != 'demo';
};

/**
 * Logs out the current user.
 */
visflow.user.logout = function() {
  $.post(visflow.user.LOGOUT_URL_)
    .done(function() {
      visflow.dialog.close();
      visflow.success('logout successful');
      visflow.signal(visflow.user, 'logout');
    }).fail(function(res) {
      // text error response
      visflow.error(res.responseText);
    });
};

/**
 * Uses the cookie session to authenticate.
 */
visflow.user.authenticate = function() {
  var sessionId = Cookies.get('PHPSESSID');
  if (sessionId !== undefined) {
    $.post(visflow.user.AUTH_URL_)
      .done(function(username) {
        visflow.user.account = {
          username: username
        };
        visflow.signal(visflow.user, 'login');
      })
      .fail(function() {
        visflow.signal(visflow.user, 'logout');
      })
      .always(function() {
        visflow.user.callLoginHook();
      });
  } else {
    visflow.signal(visflow.user, 'logout');
    visflow.user.callLoginHook();
  }
};

/**
 * Displays an error message in the dialog.
 * @param {!jQuery} dialog
 * @param {string} text
 */
visflow.user.error = function(dialog, text) {
  var error = dialog.find('.error');
  if (text === '') {
    error.hide();
    return;
  }
  error.show().text(text);
};

/**
 * Displays a warning message in the dialog.
 * @param {!jQuery} dialog
 * @param {string} text
 */
visflow.user.warning = function(dialog, text) {
  var warning = dialog.find('.warning');
  if (text === '') {
    warning.hide();
    return;
  }
  warning.show().text(text);
};

/**
 * Sets up the dialog for user registration.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.registerDialog_ = function(dialog) {
  var btn = dialog.find('#confirm');
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var repeatPassword = dialog.find('#repeat-password');
  var email = dialog.find('#email');
  var error = dialog.find('.error');
  btn.prop('disabled', true);

  var fieldsComplete = function() {
    var passwordsMatch = password.val() === repeatPassword.val();
    var passwordNonEmpty = password.val() !== '';
    var repeatPasswordNonempty = repeatPassword.val() !== '';
    var usernameNonEmpty = username.val() !== '';

    if (passwordNonEmpty && repeatPasswordNonempty && !passwordsMatch) {
      visflow.user.error(dialog, 'passwords do not match');
    }

    var emailNonEmpty = email.val() !== '';
    return passwordsMatch && passwordNonEmpty && usernameNonEmpty &&
        emailNonEmpty;
  };

  var inputChanged = function() {
    visflow.user.error(dialog, '');
    btn.prop('disabled', !fieldsComplete());
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  btn.click(function() {
    var username_ = username.val();
    var password_ = password.val();
    var email_ = email.val();
    if (password_ !== repeatPassword.val()) {
      visflow.user.error(dialog, 'passwords mismatch');
    } else if (!RegExp(visflow.user.EMAIL_REGEX_).test(email_)) {
      visflow.user.error(dialog, 'invalid email address');
    } else if (!RegExp(visflow.user.USERNAME_REGEX_).test(username_)) {
      visflow.user.error(dialog, 'username may only contain lowercase ' +
        'letters, digits and underscores');
    } else if (username_.length < visflow.user.MIN_USERNAME_LENGTH_) {
      visflow.user.error(dialog, 'username length must be at least ' +
        visflow.user.MIN_USERNAME_LENGTH_);
    } else if (password_.length < visflow.user.MIN_PASSWORD_LENGTH_) {
      visflow.user.error(dialog, 'password length must be at least ' +
        visflow.user.MIN_PASSWORD_LENGTH_);
    } else {
      // all conditions match
      $.post(visflow.user.REGISTER_URL_, {
        username: username_,
        password: password_,
        email: email_
      }).done(function() {
        visflow.dialog.close();
        visflow.success('registration successful');
        visflow.user.authenticate();
      }).fail(function(res) {
        // text error response
        visflow.user.error(dialog, res.responseText);
      });
    }
  });
};

/**
 * Sets up the dialog for user login.
 * @param {!jQuery} dialog
 * @param {{
 *   message: string
 * }=} params
 * @private
 */
visflow.user.loginDialog_ = function(dialog, params) {
  var btn = dialog.find('#confirm');
  var username = dialog.find('#username');
  var password = dialog.find('#password');
  var error = dialog.find('.error');

  if (params !== undefined) {
    if (params.message) {
      visflow.user.warning(dialog, params.message);
    }
  }

  // Shortcut links
  dialog.find('#register')
    .click(function() {
      visflow.user.register();
    });
  dialog.find('#try-demo')
    .click(function() {
      visflow.user.loginDemo();
    });

  btn.prop('disabled', true);

  var fieldsComplete = function() {
    var passwordNonEmpty = password.val() !== '';
    var usernameNonEmpty = username.val() !== '';
    return passwordNonEmpty && usernameNonEmpty;
  };

  var inputChanged = function(event) {
    var complete = fieldsComplete();
    if (event.which == visflow.interaction.keyCodes.ENTER && complete) {
      // Attempt to submit
      btn.trigger('click');
    }
    visflow.user.error(dialog, '');
    btn.prop('disabled', !complete);
  };

  dialog.find('input')
    .keydown(inputChanged)
    .change(inputChanged);

  btn.click(function() {
    var username_ = username.val();
    var password_ = password.val();

    $.post(visflow.user.LOGIN_URL_, {
      username: username_,
      password: password_
    }).done(function() {
      visflow.dialog.close();
      visflow.success('login successful');
      visflow.user.authenticate();
    }).fail(function(res) {
      // text error response
      visflow.user.error(dialog, res.responseText);
    });
  });
};

/**
 * Executes the login hook and sets the hook to null.
 */
visflow.user.callLoginHook = function() {
  if (visflow.user.loginHook != null) {
    visflow.user.loginHook();
    visflow.user.loginHook = null;
  }
};

/**
 * Sets up the dialog for user profile edit.
 * @param {!jQuery} dialog
 * @private
 */
visflow.user.profileDialog_ = function(dialog) {
};
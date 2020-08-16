var BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
var Book = require('../models/book');
var async = require('async') 

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {       
  Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

  // Validate fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  body('book').escape(),
  body('imprint').escape(),
  body('status').trim().escape(),
  body('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance(
      { book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({},'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          // Successful, so render.
          res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
        });
      return;
    }
    else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) { return next(err); }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  }
];

exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance
    .findById(req.params.id)
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
        res.redirect('/catalog/bookinstances')
      }
      // Successful, so render.
      res.render('bookinstance_delete', { title: 'Delete book copy of '+bookinstance._id, bookinstance: bookinstance});
    })
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {
  // bookinstanceid should exists in /views/bookinstance_delete.pug
  BookInstance.findByIdAndRemove(req.body.bookinstanceid, err => {
    if (err) { return next(err); }
    // Success, go to bookinstance list
    res.redirect('/catalog/bookinstances')
  })
};

// Display BookInstance create form on GET.
exports.bookinstance_update_get = function(req, res, next) {       
  async.parallel({
    bookinstance: callback => {
      BookInstance
        .findById(req.params.id)
        .exec(callback)
    },
    books: callback => {
      Book
        .find(callback)
    }
  }, (err, results) => {
    if (err) { return next(err) }
    if ( results.bookinstance==null) {
      let err = new Error('Book instance not found');
      err.status = 404;
      return next(err);
    }
    res.render('bookinstance_form', {title: 'Update book instance', book_list: results.books, bookinstance: results.bookinstance})
  })
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = [
  // Validate fields.
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  body('book').escape(),
  body('imprint').escape(),
  body('status').trim().escape(),
  body('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    let bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id:req.params.id //This is required, or a new ID will be assigned!
      }
    );

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec((err, books) => {
          if (err) {return next(err);}
          // Successful, so render.
          res.render('bookinstance_form', {title: 'Update book instance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance, bookinstance});
        })
      return;
    }
    else {
      // Data from form is valid
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, updatedbookinstance) => {
        if (err) {return next(err)}
        // Successful - redirect to new record.
        res.redirect(updatedbookinstance.url);
      });
    }
  }
];


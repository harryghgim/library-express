// use regular function in mongoose
// when using arrow function in mongoose, 'this' behaves differently
var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true}, // reference to the associated book
    imprint: { type: String, required: true },
    status: {type: String, required: true, enum: ['Maintenance', 'Available', 'Loaned', 'Reserved'], default: 'Maintenance'},
    due_back: {type: Date, default: Date.now}
  }
);

// Virtual for bookinstance's URL
BookInstanceSchema
  .virtual('url')
  .get(function () {
    return '/catalog/bookinstance/' + this._id;
  });

BookInstanceSchema
  .virtual('due_back_formatted')
  .get(function () {
    return moment(this.due_back).format('MM/DD, YYYY');
  });

BookInstanceSchema
  .virtual('due_back_update_format')
// use function(), not arrow function
  .get(function() {
    return moment(this.due_back).format('YYYY-MM-DD')
  })

BookInstanceSchema
  .virtual('status_list')
  .get(function() {
    return this.schema.path('status').enumValues
  })

// Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);

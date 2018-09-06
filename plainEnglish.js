/*global jQuery, Handlebars, Router */

// invoke the jQuery function
// when the document is loaded and the DOM is ready to be manipulated
jQuery(function ($) {

	// use strict operating context when executing this function
	'use strict';

	// register a custom Handlebars helper called eq
	// which adds custom behaviour to the Handlebars template
	// and enables the comparison of the value of the filter property that is passed into the Handlebars template
	Handlebars.registerHelper('eq', function (a, b, options) {
		// if a and b are equal use the options.fn() Handlebars template
		// which behaves like a normal Handlebars template
		// else use the options.inverse() Handlebars template
		// note: else statement associated with options.inverse() not in project so this is unnecessary
		// note: helper functions get access to the same data that we pass into our parent template making this the object that is passed in to footerTemplate
		return a === b ? options.fn(this) : options.inverse(this);
	});

	// store the keycode for the enter key, 13 as the ENTER_KEY variable
	var ENTER_KEY = 13;
	// store the keycode for the escape key, 27 as the ESCAPE_KEY variable
	var ESCAPE_KEY = 27;

	// create a new variable called util
	var util = {
		// create a util.uuid() method
		// which returns a random 32 character string with dashes at regular intervals
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';
			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}
			return uuid;
		},
		// create a util.pluralize() method that takes count and word as arguments
		pluralize: function (count, word) {
			// and if count is equal to 1, return the word argument
			// else, return the word argument with an 's' concatenated on to the end of the word
			return count === 1 ? word : word + 's';
		},
		// create a store() method that takes namespace and data as arguments
		store: function (namespace, data) {
			// if more than 1 argument is passed to the function
			if (arguments.length > 1) {
				// set, or update the Storage interface
				// using the namespace argument as the key we want to update
				// before converting the data variable into a string that can later be converted back into an object
				// and use this string as the value that is associated with that key
				return localStorage.setItem(namespace, JSON.stringify(data));
				// otherwise
			} else {
				// retrieve the value associated with the key from the Storage interface
				// that matches the namespace argument
				// and store this value in a new variable called store
				var store = localStorage.getItem(namespace);
				// then if store is truthy (store is not an empty string)
				// then convert the data held in store back into an object
				// otherwise return an empty array
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	// create a variable called App
	var App = {
		// create an App.init() method
		init: function () {
			// call the store() method on the util object
			// which when one argument is passed
			// returns the value of the todos-jquery key on the localStorage object
			// and sets the value of the todos key on the this object to that value
			this.todos = util.store('todos-jquery');
			// compile two Handlebars templates
			// in the first instance use the jQuery function to get a reference to the #todo-template element in the DOM
			// in the second instance use the jQuery function to get a reference to the #footerTemplate element in the DOM
			// then get the html associated with those elements
			// and use the html as the argument to the Handlebars.compile() methods
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			// call the bindEvents() method stored on the this object
			// which attaches event handlers to the appropriate elements in the DOM
			this.bindEvents();
			// create a new router
			new Router({
				// and when the user visits a new url in the app
				// use that url as an argument
				'/:filter': function (filter) {
					// to set the value of the filter key on the this object to the value in the relative url
					this.filter = filter;
					// then call the render method on the this object
					// which renders the app
					this.render();
				// and bind the this value in the router function
				// to the app object
				}.bind(this)
			// and use the all route as the starting page for the application
			}).init('/all');
		},

		// create an App.bindEvents() method
		bindEvents: function () {
			// use the jquery function to create a reference to the #new-todo element
			// and call the create() method stored in the this, App object when a key up event is triggered
			$('#new-todo').on('keyup', this.create.bind(this));
			// use the jquery function to create a reference to the #toggle-all element
			// and call the toggleAll() method stored in the this, App object when a change event is triggered
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			// use the jquery function to create a reference to the #clear-completed descendant of the #footer element
			// and call the destroyCompleted() method stored in the this, App object when a click event is triggered
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			// use the jquery function to create a reference to the #todo-list element
			$('#todo-list')
				// and call the toggle() method stored in the this, App object when a change event is triggered on the #todo-list's .toggle descendant
				.on('change', '.toggle', this.toggle.bind(this))
				// and call the edit() method stored in the this, App object when a change event is triggered on the #todo-list's label descendant
				.on('dblclick', 'label', this.edit.bind(this))
				// and call the editKeyup() method stored in the this, App object when a keyup event is triggered on the #todo-list's .edit descendant
				.on('keyup', '.edit', this.editKeyup.bind(this))
				// and call the update() method  stored in the this, App object when a focusout event is triggered on the #todo-list's .update descendant
				.on('focusout', '.edit', this.update.bind(this))
				// and call the destroy() method  stored in the this, App object  when a click event is triggered on the #todo-list's .destroy descendant
				.on('click', '.destroy', this.destroy.bind(this));
		},
		// create an App.render() method
		render: function () {
			// call the getFilteredTodos() method stored on the this object
			// which returns the a list of todos based on the state of the filter key
			// and store it in the todos variable
			var todos = this.getFilteredTodos();
			// use the jQuery function to get a reference to the element with an id of todo-list
			// and set the html of this element
			// to the html generated by passing in the data stored in the todos variable
			// to the handlebars template stored in the todoTemplate key of the this object
			$('#todo-list').html(this.todoTemplate(todos));
			// use the jQuery function to get a reference to the element with an id of main
			// and toggle the visibility of that element
			// by showing it if we have more than zero todos
			// and hiding it if we have 0 todos
			$('#main').toggle(todos.length > 0);
			// use the jQuery function to get a reference to the element with an id of toggle-all
			// and give it the checked attribute
			// if the value returned by the getActiveTodos method on the this object is equal to zero
			$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);
			// call the renderFooter() method stored on the this object
			// which renders a new footer element into the DOM
			this.renderFooter();
			// use the jQuery function to get a reference to the element with an id of new-todo
			// and place the cursor in that element
			$('#new-todo').focus();
			// call the store() method located in the util object
			// which stores the todo list in the todos-jquery key of the localStorage object
			util.store('todos-jquery', this.todos);
		},
		// create an App.renderFooter() method
		renderFooter: function () {
			// call the todos() method stored on the this object
			// which returns the amount of elements in the todos array
			// and count the amount of elements in that array
			// and store this number in a variable called todoCount
			var todoCount = this.todos.length;
			// call the getActiveTodos() method stored on the this object
			// which returns an array of todos based on the filter value
			// count the amount of elements in that array
			// and store that number in a variable called activeTodoCount
			var activeTodoCount = this.getActiveTodos().length;
			// call the footerTemplate method stored on the this object
			// which is a handleBars template
			var template = this.footerTemplate({
				// pass the value stored in the activeTodoCount variable into the activeTodoCount key
				activeTodoCount: activeTodoCount,
				// call the pluralize() method stored on the util object
				// and pass in the value stored in the activieTodoCount variable, and the string 'item' as arguments
				// and use the value returned by this method as the value associated with the activeTodoWord key
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				// then subtract the value stored in the activeTodoCount variable from the value stored in the todoCount variable
				// and pass this value returned by this operation to the completedTodos key
				completedTodos: todoCount - activeTodoCount,
				// then pass the value stored by the filter key on the this object into the filter key
				filter: this.filter
			});
			// use the jQuery function to create a reference to the #footer element
			// and if the value stored in the todoCount variable is more than zero, show the footer
			// and set the html of this element to the value stored in the template variable
			$('#footer').toggle(todoCount > 0).html(template);
		},
		// create a function App.toggleAll() that takes the event object as a parameter
		toggleAll: function (e) {
			// use the jQuery function to get a reference to the #toggle-all element
			// return the value of the checked property on the element returned by the jQuery function
			// and store that value inside of a new isChecked variable
			var isChecked = $(e.target).prop('checked');
			// take the array stored on the todos key of the App object
			// and for each todo in this list
			this.todos.forEach(function (todo) {
				// set the completed key of each todo
				// to the value stored in the isChecked variable
				todo.completed = isChecked;
			});
			// call the render method on the this object
			// which renders the application
			this.render();
		},
		// create a method called App.getActiveTodos()
		getActiveTodos: function () {
			// return the value that gets returned by
			// going through the list that is stored on the todos key of the this object
			// and returning a new array of all the items in the list whose completed key has a value of false
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		// create a method called App.getCompletedTodos()
		getCompletedTodos: function () {
			// return the value that gets returned by
			// going through the list that is stored on the todos key of the this object
			// and returning a new array of all the items inthe list whose completed key has a value of true
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		// create a App.getFilteredTodos() method
		getFilteredTodos: function () {
			// if the filter key on the this object has a value of 'active'
			if (this.filter === 'active') {
				// return the value that is returned by the getActiveTodos() method stored on the this object
				return this.getActiveTodos();
			}
			// if the filter key on the this object has a value of 'completed'
			if (this.filter === 'completed') {
				// return the value that is returned by the getCompletedTodos() method stored in the this object
				return this.getCompletedTodos();
			}
			// else return the value that is stored on the todos key of the this object
			return this.todos;
		},
		// create a App.desttroyCompleted() method
		destroyCompleted: function () {
			// get the value returned by the .getActiveTodos() method stored on the this object
			// and associate that value with the todos key stored on the this object
			this.todos = this.getActiveTodos();
			// set the value of the filter key stored in this object to 'all'
			this.filter = 'all';
			// call the render method on the this object
			// which renders the application
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			// find the element's closest <li/> ancestor, then retrieve the value of that element's id attribute
			// then store that value in a new variable called id
			var id = $(el).closest('li').data('id');
			// get the address of the todo list key of the this object, and associate that address with a new variable called todos
			var todos = this.todos;
			// return the length of the list stored in the todos variable, and store it in a new variable called i
			var i = todos.length;
			// begin executing a loop, using the value of i as a starting point
			// starting from the value stored in i, incrememnting the value of i down by 1 with each execution
			// until the value of i reached zero
			while (i--) {
				// if the item in the todos array with a position of i
				// has an id property that has a value that is equal to the value stored in the id variable
				if (todos[i].id === id) {
					// return the value of i
					return i;
				}
			}
		},
		// create a method called App.create() that uses the event object
		create: function (e) {
			// use the jquery function to get a reference to the element that triggered the event
			// and store that reference in a variable called input
			var $input = $(e.target);
			// look at the element being referenced by the input variable
			// extract the value of its value attribute and remove any additional white space from both sides of that value
			// then that value inside of a new variable called val
			var val = $input.val().trim();
			// if they keycode that triggered the event
			// is not equal to the value stored in the ENTER_KEY variable
			// or if the value stored in the val variable is falsey (its an empty string)
			if (e.which !== ENTER_KEY || !val) {
				// exit the function and return the value undefined
				return;
			}
			// else take the list stored on the todos key of the this object
			// and add an item to the end of that list
			this.todos.push({
				// with an id property whose value is the value returned by util.uuid()
				id: util.uuid(),
				// with a title property whose value is the value stored in the val variable
				title: val,
				// and with a completed property whose value is false
				completed: false
			});
			// then set the value attribute of the element referenced by the $input variable to an empty string
			$input.val('');
			// then call the render() method that is stored on the this object
			// which renders the application
			this.render();
		},
		// create a method called App.toggle() that uses the event object
		toggle: function (e) {
			// return the position of the element that triggered the event
			// and store that position of that element a new variable called i
			var i = this.indexFromEl(e.target);
			// then use value stored in the variable i to find the todo that triggered the event
			// and set its new completed value the opposite of its current completed value
			this.todos[i].completed = !this.todos[i].completed;
			// then call the render method on the this object
			// which renders the appication
			this.render();
		},
		// create a method called App.edit() that uses the event object
		edit: function (e) {
			// use the jquery function to create a reference to the element that triggered the event
			// traverse up the DOM tree from that element and grab the first li element
			// and add an 'editing' class to that element
			// before traversing down the descendants of the element with a new class of 'editing'
			// and return a list of all the elements that have the edit class on them
			// and store a reference to this list in a new variable called $input
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			// place the curson in the element referenced by the variable called $input
			$input.focus();
		},
		// create a method called App.editKeyup() that uses the event object
		editKeyup: function (e) {
			// if the keycode on the element that triggered the event matches the value stored in the ENTER_KEY variable
			if (e.which === ENTER_KEY) {
				// take the cursor out of the element that triggered the event
				e.target.blur();
			}
			// if the keycode on the element that triggered the event matches the value stored in the ESCAPE_KEY variable
			if (e.which === ESCAPE_KEY) {
				// use the jQuery function to get a reference to the element that triggered the event
				// and set set the value of its abort key to a value of true
				// then remove the cursor from that element
				$(e.target).data('abort', true).blur();
			}
		},
		// create a method called App.update() that uses the event object
		update: function (e) {
			// create a refrence to the element that triggered the event
			// and store it in a variable called el
			var el = e.target;
			// create a jQuery reference to the element referenced by the variable el
			var $el = $(el);
			// get the element referenced by the variable $el
			// and return the value of that element's value key
			// after unnecessary white space has been removed from the value
			// and store this value in a new variable called val
			var val = $el.val().trim();
			// if the value stored in val is not truthy(is an empty string)
			if (!val) {
				// run the destroy method stored in this object using the event object as an argument
				// which removes the current item from the array
				this.destroy(e);
				// then exit the method
				return;
			}
			// if the element referenced by the variable $el
			// has a key called abort that is truthy (has a string in it)
			if ($el.data('abort')) {
				// set the value of its abort key to false
				$el.data('abort', false);
				// else
			} else {
				// call the indexFromEl method that is stored on the this object
				// which returns the position of the todo that triggered the event
				// and set the title key of the element that is returned to the value stored in the val variable
				this.todos[this.indexFromEl(el)].title = val;
			}
			// then call the render() method that is stored on the this object
			// which renders the application
			this.render();
		},
		// create a method called App.destroy() that uses the event object
		destroy: function (e) {
			// take the list of todos that are stored in the todos key of the this object
			// and modify this list
			// by calling the function that is stored on the indexFromEl key on the this object
			// which returns the position of the todo item that was clicked
			// and then begin removing todos starting from this item
			// for a total of 1 items
			this.todos.splice(this.indexFromEl(e.target), 1);
			// then call the render method that is stored on the this object
			// which renders the application
			this.render();
		}
	};
	// call the init() method which is stored on the App object
	// which initializes the application
	App.init();
});

// UNFAMILIAR CONCEPTS:
// 1) jQuery(function($){})); allows us to execute some jQuery code when the document is ready
// 2) strict mode is a voluntarily applied set of rules that you can abide by when running Javascript code
// 3) jQuery: .closest(selector) - Gets the first element that matches the selector by testing the element and traversing up through its ancestors in the DOM tree
// 4) jQuery: .data(key,value) - Store arbitrary data associated with the matched elements or return the value at the named data store
// 5) jQuery: .addClass(className) - Adds the spcified classes to each element in the set of matched elements
// 6) jQuery: .find(className) - Traverse through all the descendants of a matched element and construct a new jQuery object with this set of matched elements

// USEFUL LINKS:
// 1) jQuery Docs: https://api.jquery.com/
// 2) Project Github: https://github.com/tastejs/todomvc
// 3) App spec: https://github.com/tastejs/todomvc/blob/master/app-spec.md

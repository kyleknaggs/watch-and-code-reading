/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
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
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		// done
		init: function () {
			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		bindEvents: function () {
			$('#new-todo').on('keyup', this.create.bind(this));
			$('#toggle-all').on('change', this.toggleAll.bind(this));
			$('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
			$('#todo-list')
				.on('change', '.toggle', this.toggle.bind(this))
				.on('dblclick', 'label', this.edit.bind(this))
				.on('keyup', '.edit', this.editKeyup.bind(this))
				.on('focusout', '.edit', this.update.bind(this))
				.on('click', '.destroy', this.destroy.bind(this));
		},
		// done
		render: function () {
			var todos = this.getFilteredTodos();
			// insert the handlebars generated mark up into #todo-list
			var todoList = document.querySelector('#todo-list');
			todoList.innerHTML = this.todoTemplate(todos);
			// only show the main element if there is more than 0 todos
			var main = document.querySelector('#main');
			if(todos.length > 0){
				main.style.display = 'block';
			}else{
				main.style.display = 'none';
			}
			// get the toggle-all element & set it to checked if there are 0 active todos
			var toggleAll = document.querySelector('#toggle-all');
			if(this.getActiveTodos().length === 0){
				toggleAll.checked = true;
			}else{
				toggleAll.checked = false;
			}
			this.renderFooter();
			// get the newTodo element and place the cursor in that element
			var newTodo = document.querySelector('#new-todo');
			newTodo.focus();
			util.store('todos-jquery', this.todos);
		},
		// done
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});
			// get footer element
			var footer = document.querySelector('footer');
			// show it if there is one or more todos
			if(todoCount > 0){
				footer.style.display = 'block';
			}else{
				footer.style.display = 'none';
			}
			// and set its html to the value stored in the template variable
			footer.innerHTML = template;
		},
		// done
		toggleAll: function (e) {

			var target = e.target;
			var isChecked = target.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		// done
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		// done
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		// done
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		// done
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array

		// done
		indexFromEl: function (el) {
			function getParentListElement(element){
				var elementToTest = element;
				var elementTagName = element.tagName;
				while(elementTagName !== 'LI'){
					elementToTest = elementToTest.parentNode;
					elementTagName = elementToTest.tagName;
				}
				return elementToTest;
			}
			var parentListElement = getParentListElement(el);
			var id = parentListElement.getAttribute('data-id');

			var todos = this.todos;
			var i = todos.length;
			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		// done
		create: function (e) {
			var input = e.target;
			var val = input.value.trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			input.value = '';

			this.render();
		},
		// done
		toggle: function (e) {
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		// done
		edit: function (e) {
			// get element that triggered event
			var target = e.target;
			// start at that element and traverse up the DOM till we find an <li>
			function findParentLi(){
				var parentElement = target.parentNode;
				while (parentElement.tagName !== 'LI') {
					parentElement = parentElement.parentNode;
				}
				return parentElement;
			}
			var closestLi = findParentLi();
			// add a class of editing to that element
			closestLi.classList.add('editing');
			// and return a list of that element's child nodes
			var childElements = closestLi.children;
			var input;
			for(let i=0; i<childElements.length; i++){
				if(childElements[i].classList.contains('edit')){
					input = childElements[i];
				}
			}
			// and place the cursor in the element
			input.focus();
		},
		// wait till later to figure out how to do .data() in vanilla JS
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		// wait till later to figure out how to do .data() in vanilla JS
		update: function (e) {
			var target = e.target;
			// use the jquery object to wrap target
			var $el = $(target);
			var targetValue = target.value.trim();

			if (!targetValue) {
				this.destroy(e);
				return;
			}

			// if the abort key of the target element is set to true
			if ($el.data('abort')) {
				// make it false
				$el.data('abort', false);
			} else {
				this.todos[this.indexFromEl(target)].title = targetValue;
			}

			this.render();
		},
		// done
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	// notes:
	// 1) jQuery objects don't have a getAttribute method. You can either use .attr or .data instead
	// 2) use element.tagName to get uppercase string of element's tag name in vanilla js
	// 3) use element.parentNode to get parent dom node in vanilla js
	// done

	App.init();
});

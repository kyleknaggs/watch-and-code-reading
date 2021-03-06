/* global Handlebars, Router */

document.addEventListener("DOMContentLoaded", function(event) {

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
			// 1) set the val of this.todos
				// to the val of the todos key on the localStorage object
			this.todos = util.store('todos-jquery');
			// 2) get the markup stored in #todo-template and #footer-template
				// pass these strings into Handlebars to create 2 Handlebars templates
				// and store these templates on this.todoTemplate and this.footerTemplate
				// so they can be accessed later
			var todoTemplate = document.querySelector('#todo-template').innerHTML;
			var footerTemplate = document.querySelector('#footer-template').innerHTML;
			this.todoTemplate = Handlebars.compile(todoTemplate);
			this.footerTemplate = Handlebars.compile(footerTemplate);
			// 3) call the bindEvents() method to set up all the event listeners in the app
			this.bindEvents();
			// 4) create a new Router instance
				// https://glitch.com/edit/#!/kk-todomvc-routingdemo?path=views/index.html:1:0
				// that accounts for '/all', '/active' & '/completed' routes using ':'
				// stores all of these url values on the a correspondingly named key on the App object
				// manually change the this value inside of the Router object from the Router object to the App object
				// and start the application on the '/all route'
			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		// done
		bindEvents: function () {
			// 1) grab #new-todo, #toggle-all, #footer & #todo-list
			var newTodo = document.querySelector('#new-todo');
			var toggleAll = document.querySelector('#toggle-all');
			var footer = document.querySelector('#footer');
			var todoList = document.querySelector('#todo-list');
			// 2) and bind event listeners to the following elements
				// call App.create() when a keyup event occurs on #new-todo
				// call App.toggleAll() when a change event occurs on #toggle-all
				// call App.destroyCompleted() when a click event occurs on #footer
				// call App.toggle() when a change event occurs on #todo-list
				// call App.edit() when a dblclick event occurs on #todo-list
				// call App.editKeyup() when a keyup event occurs on #todo-list
				// call App.update() when a focusout event occurs on #todo-list
				// call App.destroy() when a click event occurs on #todo-list
			newTodo.addEventListener('keyup', this.create.bind(this));
			toggleAll.addEventListener('change', this.toggleAll.bind(this));
			footer.addEventListener('click', this.destroyCompleted.bind(this));
			todoList.addEventListener('change',this.toggle.bind(this));
			todoList.addEventListener('dblclick',this.edit.bind(this));
			todoList.addEventListener('keyup',this.editKeyup.bind(this));
			todoList.addEventListener('focusout',this.update.bind(this));
			todoList.addEventListener('click',this.destroy.bind(this));
		},
		render: function () {

			var todos = this.getFilteredTodos();
			var todoList = document.querySelector('#todo-list');
			todoList.innerHTML = this.todoTemplate(todos);

			var main = document.querySelector('#main');
			if(todos.length > 0){
				main.style.display = 'block';
			}else{
				main.style.display = 'none';
			}

			var toggleAll = document.querySelector('#toggle-all');
			if(this.getActiveTodos().length === 0){
				toggleAll.checked = true;
			}else{
				toggleAll.checked = false;
			}

			this.renderFooter();
			var newTodo = document.querySelector('#new-todo');
			newTodo.focus();
			util.store('todos-jquery', this.todos);

		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			var footer = document.querySelector('footer');

			if(todoCount > 0){
				footer.style.display = 'block';
			}else{
				footer.style.display = 'none';
			}

			footer.innerHTML = template;
		},
		toggleAll: function (e) {

			var target = e.target;
			var isChecked = target.checked;

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function (e) {
			if(e.target.id !== 'clear-completed'){
				return;
			}
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
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
		create: function (e) {
			// 1) grab the element that triggered the event
			// 2) return the value stored in this element's value attribute, while removing any surrounding whitespace
			var input = e.target;
			var val = input.value.trim();
			// 3) then exit the function if in fact the check to see if the enter key was clicked
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
		toggle: function (e) {
			if(e.target.className !== 'toggle'){
				return;
			}
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		edit: function (e) {
			if(e.target.tagName !== 'LABEL'){
				return;
			}

			var target = e.target;
			function findParentLi(){
				var parentElement = target.parentNode;
				while (parentElement.tagName !== 'LI') {
					parentElement = parentElement.parentNode;
				}
				return parentElement;
			}

			var closestLi = findParentLi();
			closestLi.classList.add('editing');
			var childElements = closestLi.children;
			var input;

			for(let i=0; i<childElements.length; i++){
				if(childElements[i].classList.contains('edit')){
					input = childElements[i];
				}
			}

			input.focus();
		},
		editKeyup: function (e) {
			if(e.target.className !== 'edit'){
				return;
			}
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}
			if (e.which === ESCAPE_KEY) {
				e.target.setAttribute('data-abort', true);
				e.target.blur();
			}
		},
		update: function (e) {

			if(e.target.className !== 'edit'){
				return;
			}

			var el = e.target;
			var value = el.value.trim();

			if (!value) {
				this.destroy(e);
				return;
			}

			if (el.dataset.abort) {
				el.setAttribute('data-abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = value;
			}

			this.render();
		},
		destroy: function (e) {

			// extra condition ensures calls from update() are not exited
			if((e.type === 'click') && (e.target.className !== 'destroy')||(
				(e.type === 'focusout') && (e.target.className !== 'edit'))){
				return;
			}

			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();

		}
	};

	App.init();

});

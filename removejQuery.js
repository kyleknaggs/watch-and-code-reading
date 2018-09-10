/* global jQuery, Handlebars, Router */

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
		init: function () {

			var todoTemplate = document.querySelector('#todo-template').innerHTML;
			var footerTemplate = document.querySelector('#footer-template').innerHTML;

			this.todos = util.store('todos-jquery');
			this.todoTemplate = Handlebars.compile(todoTemplate);
			this.footerTemplate = Handlebars.compile(footerTemplate);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');

		},
		bindEvents: function () {
			// grab elements
			var newTodo = document.querySelector('#new-todo');
			var toggleAll = document.querySelector('#toggle-all');
			var footer = document.querySelector('#footer');
			var todoList = document.querySelector('#todo-list');
			// bind events
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

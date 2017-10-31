"""
The standard run context API.

Context allows for containing information in a cross-cutting way through a thread's stack.

Each thread is assigned a context stack dictionary.  When a new context is entered, it is done so through a
`@` style decorator on a function.  This pushes the new context into the dictionary stack.  When the `@` style
decorated function is exited, the context is popped.

"""

import threading
from .errors import (
    InvalidParentContextError, InvalidContextExitError,
    ContextAlreadyRegisteredError, NoSuchContextError,
    InvalidChildContextNameError
)

_THREAD_CONTEXT_STACK = {}
_LOCK = threading.RLock()
_CONTEXT_LOCK = threading.RLock()
_CONTEXT_REGISTRY = {}


class RunContext(object):
    """
    A run context.
    """

    def __init__(self, name: str, parent=None, **kargs):
        """
        Subclasses must pass the `name` parameter as a value into the

        :param name:
        :param parent:
        :param kargs:
        """
        object.__init__(self)
        self.__name = name
        if parent is not None:
            assert isinstance(parent, RunContext), 'Parent must be a run context instance'
            assert parent.name == name, 'parent must be of type {0} (found {1}'.format(name, parent.name)
        self._parent = parent

    @property
    def name(self):
        return self.__name

    @property
    def parent(self):
        return self._parent

    def enter_context(self, **kargs):
        """
        Called when a child context is entered.  Must return another RunContext instance of this type,
        or raise an error.

        :param kargs: variable arguments, as required by the context.
        :return: RunContext
        :raise: NestedContextError
        """
        raise NotImplemented()


def register_context(name: str, context_class: type):
    with _CONTEXT_LOCK:
        # Security check.
        if name in _CONTEXT_REGISTRY:
            if _CONTEXT_REGISTRY[name] == context_class:
                return
            raise ContextAlreadyRegisteredError(name, _CONTEXT_REGISTRY[name], context_class)
        _CONTEXT_REGISTRY[name] = context_class


def run_in_context(name, **kargs):
    context_class = None
    with _CONTEXT_LOCK:
        if name not in _CONTEXT_REGISTRY:
            raise NoSuchContextError(name)
        context_class = _CONTEXT_REGISTRY[name]

    assert isinstance(context_class, type)
    context_hash = _context_hash(name, context_class)
    current_thread = threading.current_thread()

    # Lock only within the multi-thread shared section.
    with _LOCK:
        if current_thread.ident not in _THREAD_CONTEXT_STACK:
            context_dict = {}
            _THREAD_CONTEXT_STACK[current_thread.ident] = context_dict
            # TODO is there a way to hook in a memory release when the thread exits?
        else:
            context_dict = _THREAD_CONTEXT_STACK[current_thread.ident]

    if context_hash not in context_dict:
        stack = []
        context_dict[context_hash] = stack
    else:
        stack = context_dict[context_hash]

    parent = len(stack) <= 0 and None or stack[-1]
    # Name should be hard-coded by the context.
    child_context = context_class(parent=parent, **kargs)
    if child_context.parent != parent:
        raise InvalidParentContextError(stack[-1], child_context)
    if child_context.name != name:
        raise InvalidChildContextNameError(parent, child_context, name)

    stack.append(child_context)


def pop_context(expected_context: RunContext):
    current_thread = threading.current_thread()
    context_hash = _context_hash(expected_context.name, expected_context.__class__)

    # Lock only within the multi-thread shared section.
    context_dict = None
    with _LOCK:
        if current_thread.ident not in _THREAD_CONTEXT_STACK:
            raise InvalidContextExitError(None, expected_context)
        context_dict = _THREAD_CONTEXT_STACK[current_thread.ident]

    if context_dict is None or context_hash not in context_dict:
        raise InvalidParentContextError(None, expected_context)

    stack = context_dict[context_hash]
    if len(stack) <= 0:
        raise InvalidParentContextError(None, expected_context)

    if stack[-1] != expected_context:
        raise InvalidParentContextError(stack[-1], expected_context)

    stack.pop()
    expected_context._parent = None
    if len(stack) <= 0:
        del context_dict[expected_context.name]
        if len(context_dict) <= 0:
            with _LOCK:
                del _THREAD_CONTEXT_STACK[current_thread.ident]


def _context_hash(name: str, run_context: type) -> str:
    # return '{0}@{1}'.format(name, hash(run_context))
    return name

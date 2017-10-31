

class ContextError(Exception):
    """
    Top-level error handling all context problems.
    """
    def __init__(self):
        Exception.__init__(self, 'General run context error')


class ContextRegistrationError(RuntimeError):
    pass


class ContextAlreadyRegisteredError(ContextRegistrationError):
    def __init__(self, name: str, existing_class: type, requested_class: type):
        ContextRegistrationError.__init__(
            self,
            'Attempted to register context `{0}` as type {1}, but it is already registered as {2}'.format(
                name, existing_class.__name__,requested_class.__name__
            )
        )
        self.name = name
        self.existing_class = existing_class
        self.requested_class = requested_class


class NoSuchContextError(ContextRegistrationError):
    def __init__(self, name):
        ContextRegistrationError.__init__(
            self,
            'No such registered context named `{0}`'.format(name)
        )


class InvalidContextEnterError(ContextError):
    def __init__(self, parent_context, child_context, name):
        InvalidContextEnterError.__init__(self)
        self.parent_context = parent_context
        self.child_context = child_context
        self.requested_context_name = name


class InvalidParentContextError(InvalidContextEnterError):
    """
    The current parent context does not match the active context.
    """
    def __init__(self, parent_context, child_context):
        InvalidContextEnterError.__init__(self, parent_context, child_context, child_context.name)

    def __str__(self):
        return 'Current run context ({0}) is not the parent of new context ({1})'.format(
            self.parent_context, self.child_context
        )


class InvalidChildContextNameError(InvalidContextEnterError):
    """
    The child context didn't set the name right.
    """
    def __init__(self, parent_context, child_context, name):
        InvalidContextEnterError.__init__(self, parent_context, child_context, name)

    def __str__(self):
        return 'Expected child context named `{0}`, but found {1})'.format(
            self.requested_context_name, self.child_context.name
        )



class InvalidContextExitError(ContextError):
    def __init__(self, parent_context, child_context):
        ContextError.__init__(self)
        self.parent_context = parent_context
        self.child_context = child_context

    def __str__(self):
        return 'Current run context ({0}) does not match the run context just left ({1})'.format(
            self.parent_context, self.child_context
        )


class NestedContextError(ContextError):
    """
    The child context could not be created due to parent context restrictions.
    """
    def __init__(self, parent_context, context_args):
        ContextError.__init__(self)
        self.parent_context = parent_context
        self.context_args = context_args

    def __str__(self):
        return 'Parent run context ({0}) refused entering a child run context as {1}'.format(
            self.parent_context, repr(self.context_args)
        )


class ExpandedPermissionContextError(NestedContextError):
    """
    The child context expected wider permissions than the parent permitted.
    """
    def __init__(self, parent_context, parent_permissions, requested_permissions):
        NestedContextError.__init__(self, parent_context, {
            'parentPermissions': parent_permissions, 'requestedPermissions': requested_permissions
        })

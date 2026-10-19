import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import { CloseButton, type CloseButtonProps } from './close-button';
import * as React from 'react';

export interface DialogContentProps extends ChakraDialog.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement | null>;
    backdrop?: boolean;
    positionerProps?: ChakraDialog.PositionerProps;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(props, ref) {
    const { children, portalled = true, portalRef, backdrop = true, positionerProps, ...rest } = props;

    return (
        <Portal disabled={!portalled} container={portalRef}>
            {backdrop && <ChakraDialog.Backdrop />}
            <ChakraDialog.Positioner {...positionerProps}>
                <ChakraDialog.Content ref={ref} {...rest} asChild={false}>
                    {children}
                </ChakraDialog.Content>
            </ChakraDialog.Positioner>
        </Portal>
    );
});

export interface DialogCloseTriggerProps extends ChakraDialog.CloseTriggerProps {
    buttonSize?: CloseButtonProps['size'];
}

export const DialogCloseTrigger = React.forwardRef<HTMLButtonElement, DialogCloseTriggerProps>(
    function DialogCloseTrigger({ buttonSize = 'sm', ...props }, ref) {
        return (
            <ChakraDialog.CloseTrigger position='absolute' top='2' insetEnd='2' {...props} asChild>
                <CloseButton size={buttonSize} ref={ref}>
                    {props.children}
                </CloseButton>
            </ChakraDialog.CloseTrigger>
        );
    },
);

export const DialogRoot = ChakraDialog.Root;
export const DialogFooter = ChakraDialog.Footer;
export const DialogHeader = ChakraDialog.Header;
export const DialogBody = ChakraDialog.Body;
export const DialogBackdrop = ChakraDialog.Backdrop;
export const DialogTitle = ChakraDialog.Title;
export const DialogDescription = ChakraDialog.Description;
export const DialogTrigger = ChakraDialog.Trigger;
export const DialogActionTrigger = ChakraDialog.ActionTrigger;

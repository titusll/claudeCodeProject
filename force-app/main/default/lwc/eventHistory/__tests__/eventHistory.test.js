import { createElement } from 'lwc';
import EventHistory from 'c/eventHistory';
import getEvents from '@salesforce/apex/EventHistoryController.getEvents';
import deleteEvent from '@salesforce/apex/EventHistoryController.deleteEvent';

jest.mock(
    '@salesforce/apex/EventHistoryController.getEvents',
    () => {
        const { createApexTestWireAdapter } =
            require('@salesforce/sfdx-lwc-jest');
        return { default: createApexTestWireAdapter(jest.fn()) };
    },
    { virtual: true }
);

jest.mock(
    '@salesforce/apex/EventHistoryController.deleteEvent',
    () => ({ default: jest.fn() }),
    { virtual: true }
);

const MOCK_EVENTS = [
    {
        Id: 'a00000000000001AAA',
        Name: 'Summer Concert',
        Type__c: 'Concert',
        Status__c: 'Confirmed',
        Event_Date__c: '2026-06-15T10:00:00.000Z',
        Venue__c: null,
        Venue__r: null
    },
    {
        Id: 'a00000000000002AAA',
        Name: 'Tech Conference',
        Type__c: 'Conference',
        Status__c: 'Planning',
        Event_Date__c: '2026-07-20T09:00:00.000Z',
        Venue__c: null,
        Venue__r: null
    }
];

function createComponent(ownerId = '005000000000001AAA') {
    const element = createElement('c-event-history', { is: EventHistory });
    element.ownerId = ownerId;
    document.body.appendChild(element);
    return element;
}

function flushPromises() {
    return new Promise((resolve) => {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(resolve, 0);
    });
}

describe('c-event-history', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    describe('loading state', () => {
        it('displays spinner before data loads', () => {
            const element = createComponent();

            const spinner =
                element.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).not.toBeNull();
            expect(spinner.alternativeText).toBe('Loading events');
        });
    });

    describe('with event data', () => {
        it('renders event cards for each record', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const cards =
                element.shadowRoot.querySelectorAll('.event-history__card');
            expect(cards).toHaveLength(2);
        });

        it('displays event name with type as title', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const title = element.shadowRoot.querySelector(
                '.event-history__card-title'
            );
            expect(title.textContent).toBe('Summer Concert - Concert');
        });

        it('formats event date correctly', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const details = element.shadowRoot.querySelectorAll(
                '.event-history__card-detail'
            );
            expect(details[0].textContent).toBe('15 June 2026');
        });

        it('displays event status', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const details = element.shadowRoot.querySelectorAll(
                '.event-history__card-detail'
            );
            expect(details[1].textContent).toBe('Confirmed');
        });

        it('renders Edit and Delete buttons per card', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const firstCard =
                element.shadowRoot.querySelector('.event-history__card');
            const buttons = firstCard.querySelectorAll(
                '.event-history__button'
            );
            expect(buttons).toHaveLength(2);
            expect(buttons[0].textContent).toContain('Edit');
            expect(buttons[1].textContent).toContain('Delete');
        });

        it('sets accessible labels on action buttons', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const editBtn = element.shadowRoot.querySelector(
                '.event-history__button[data-id="a00000000000001AAA"]'
            );
            expect(editBtn.getAttribute('aria-label')).toBe(
                'Edit Summer Concert'
            );
        });

        it('hides spinner when data is loaded', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const spinner =
                element.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).toBeNull();
        });
    });

    describe('empty state', () => {
        it('displays empty message when no events', async () => {
            const element = createComponent();
            getEvents.emit([]);
            await flushPromises();

            const emptyMsg = element.shadowRoot.querySelector(
                '.event-history__empty'
            );
            expect(emptyMsg).not.toBeNull();
            expect(emptyMsg.textContent).toContain('No events found');
        });
    });

    describe('error handling', () => {
        it('shows empty state on wire error', async () => {
            const element = createComponent();
            getEvents.error({ body: { message: 'Server error' } });
            await flushPromises();

            const emptyMsg = element.shadowRoot.querySelector(
                '.event-history__empty'
            );
            expect(emptyMsg).not.toBeNull();
        });
    });

    describe('add event', () => {
        it('opens form modal when Add Event is clicked', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const addBtn = element.shadowRoot.querySelector(
                '.event-history__button--add'
            );
            addBtn.click();
            await flushPromises();

            const modal =
                element.shadowRoot.querySelector('[role="dialog"]');
            expect(modal).not.toBeNull();
        });

        it('shows "New Event" as modal title for create', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--add')
                .click();
            await flushPromises();

            const heading = element.shadowRoot.querySelector(
                '.slds-modal__header .slds-modal__title'
            );
            expect(heading.textContent).toBe('New Event');
        });
    });

    describe('edit event', () => {
        it('opens form modal when Edit is clicked', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const editBtn = element.shadowRoot.querySelector(
                '.event-history__button[data-id="a00000000000001AAA"]'
            );
            editBtn.click();
            await flushPromises();

            const modal =
                element.shadowRoot.querySelector('[role="dialog"]');
            expect(modal).not.toBeNull();
        });

        it('shows "Edit Event" as modal title for edit', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector(
                    '.event-history__button[data-id="a00000000000001AAA"]'
                )
                .click();
            await flushPromises();

            const heading = element.shadowRoot.querySelector(
                '.slds-modal__header .slds-modal__title'
            );
            expect(heading.textContent).toBe('Edit Event');
        });

        it('passes record id to record-edit-form', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector(
                    '.event-history__button[data-id="a00000000000001AAA"]'
                )
                .click();
            await flushPromises();

            const form = element.shadowRoot.querySelector(
                'lightning-record-edit-form'
            );
            expect(form.recordId).toBe('a00000000000001AAA');
        });
    });

    describe('delete event', () => {
        it('opens delete confirmation modal', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const deleteBtn = element.shadowRoot.querySelector(
                '.event-history__button--delete'
            );
            deleteBtn.click();
            await flushPromises();

            const alertDialog =
                element.shadowRoot.querySelector('[role="alertdialog"]');
            expect(alertDialog).not.toBeNull();
        });

        it('calls deleteEvent apex on confirmation', async () => {
            deleteEvent.mockResolvedValue(undefined);
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--delete')
                .click();
            await flushPromises();

            const confirmBtn = element.shadowRoot.querySelector(
                '.slds-button_destructive'
            );
            confirmBtn.click();
            await flushPromises();

            expect(deleteEvent).toHaveBeenCalledWith({
                eventId: 'a00000000000001AAA'
            });
        });

        it('closes delete modal on cancel', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--delete')
                .click();
            await flushPromises();

            const cancelBtn = element.shadowRoot.querySelector(
                '[role="alertdialog"] .slds-button_neutral'
            );
            cancelBtn.click();
            await flushPromises();

            const alertDialog =
                element.shadowRoot.querySelector('[role="alertdialog"]');
            expect(alertDialog).toBeNull();
        });
    });

    describe('modal close', () => {
        it('closes form modal on Cancel click', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--add')
                .click();
            await flushPromises();

            const cancelBtn = element.shadowRoot.querySelector(
                '[role="dialog"] .slds-button_neutral'
            );
            cancelBtn.click();
            await flushPromises();

            const modal =
                element.shadowRoot.querySelector('[role="dialog"]');
            expect(modal).toBeNull();
        });

        it('closes form modal on Escape key', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--add')
                .click();
            await flushPromises();

            const modal =
                element.shadowRoot.querySelector('[role="dialog"]');
            modal.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
            );
            await flushPromises();

            expect(
                element.shadowRoot.querySelector('[role="dialog"]')
            ).toBeNull();
        });
    });

    describe('section heading', () => {
        it('renders Event History title', async () => {
            const element = createComponent();
            getEvents.emit([]);
            await flushPromises();

            const title = element.shadowRoot.querySelector(
                '.event-history__title'
            );
            expect(title.textContent).toBe('Event History');
        });
    });

    describe('accessibility', () => {
        it('uses a list role for events container', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const list = element.shadowRoot.querySelector(
                '.event-history__list'
            );
            expect(list.getAttribute('role')).toBe('list');
            expect(list.getAttribute('aria-label')).toBe('Event records');
        });

        it('uses listitem role for each event card', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const items = element.shadowRoot.querySelectorAll(
                '.event-history__card'
            );
            items.forEach((item) => {
                expect(item.getAttribute('role')).toBe('listitem');
            });
        });

        it('groups action buttons with aria-label', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            const group = element.shadowRoot.querySelector(
                '.event-history__card-actions'
            );
            expect(group.getAttribute('role')).toBe('group');
            expect(group.getAttribute('aria-label')).toBe(
                'Actions for Summer Concert'
            );
        });

        it('modal has proper aria attributes', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--add')
                .click();
            await flushPromises();

            const modal =
                element.shadowRoot.querySelector('[role="dialog"]');
            expect(modal.getAttribute('aria-modal')).toBe('true');
            expect(
                modal.getAttribute('aria-labelledby')
            ).toContain('form-modal-heading');
        });

        it('delete modal uses alertdialog role', async () => {
            const element = createComponent();
            getEvents.emit(MOCK_EVENTS);
            await flushPromises();

            element.shadowRoot
                .querySelector('.event-history__button--delete')
                .click();
            await flushPromises();

            const dialog =
                element.shadowRoot.querySelector('[role="alertdialog"]');
            expect(dialog).not.toBeNull();
            expect(
                dialog.getAttribute('aria-describedby')
            ).toContain('delete-modal-content');
        });
    });
});

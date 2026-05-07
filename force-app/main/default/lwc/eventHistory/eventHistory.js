import { LightningElement, api, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEvents from '@salesforce/apex/EventHistoryController.getEvents';
import deleteEvent from '@salesforce/apex/EventHistoryController.deleteEvent';

export default class EventHistory extends LightningElement {
    @api ownerId;

    wiredEventsResult;
    events = [];
    isLoading = true;
    isFormModalOpen = false;
    isDeleteModalOpen = false;
    selectedRecordId = null;
    recordToDeleteId = null;
    _triggerElement = null;
    _shouldFocusModal = false;

    get hasEvents() {
        return this.events && this.events.length > 0;
      
    }

    get modalTitle() {
        return this.selectedRecordId ? 'Edit Event' : 'New Event';
    }

    get eventList() {
        return this.events.map((evt) => ({
            Id: evt.Id,
            displayName:
                evt.Name + (evt.Type__c ? ' - ' + evt.Type__c : ''),
            displayDate: evt.Event_Date__c
                ? this.formatDate(evt.Event_Date__c)
                : 'No date set',
            displayStatus: evt.Status__c || 'No status',
            actionsLabel: `Actions for ${evt.Name}`,
            editLabel: `Edit ${evt.Name}`,
            deleteLabel: `Delete ${evt.Name}`
        }));
    }

    @wire(getEvents, { ownerId: '$ownerId' })
    wiredGetEvents(result) {
        this.wiredEventsResult = result;
        const { data, error } = result;
        if (data) {
            this.events = data;
            this.isLoading = false;
        } else if (error) {
            this.events = [];
            this.isLoading = false;
            this.showToast('Error', this.getErrorMessage(error), 'error');
        }
    }

    renderedCallback() {
        if (this._shouldFocusModal) {
            this._shouldFocusModal = false;
            const modal = this.template.querySelector(
                '[role="dialog"], [role="alertdialog"]'
            );
            if (modal) {
                modal.focus();
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    handleAddEvent() {
        this._triggerElement = this.template.querySelector(
            '.event-history__button--add'
        );
        this.selectedRecordId = null;
        this.isFormModalOpen = true;
        this._shouldFocusModal = true;
    }

    handleEdit(event) {
        this._triggerElement = event.currentTarget;
        this.selectedRecordId = event.currentTarget.dataset.id;
        this.isFormModalOpen = true;
        this._shouldFocusModal = true;
    }

    closeFormModal() {
        this.isFormModalOpen = false;
        this.selectedRecordId = null;
        if (this._triggerElement) {
            this._triggerElement.focus();
            this._triggerElement = null;
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        if (!this.selectedRecordId) {
            fields.OwnerId = this.ownerId;
        }
        this.template
            .querySelector('lightning-record-edit-form')
            .submit(fields);
    }

    handleFormSuccess() {
        const action = this.selectedRecordId ? 'updated' : 'created';
        this.showToast('Success', `Event ${action} successfully.`, 'success');
        this.closeFormModal();
        return refreshApex(this.wiredEventsResult);
    }

    handleFormError(event) {
        this.showToast(
            'Error',
            event.detail.message || 'An error occurred while saving.',
            'error'
        );
    }

    handleSaveClick() {
        this.template
            .querySelector('lightning-record-edit-form')
            .submit();
    }

    handleDeleteClick(event) {
        this._triggerElement = event.currentTarget;
        this.recordToDeleteId = event.currentTarget.dataset.id;
        this.isDeleteModalOpen = true;
        this._shouldFocusModal = true;
    }

    closeDeleteModal() {
        this.isDeleteModalOpen = false;
        this.recordToDeleteId = null;
        if (this._triggerElement) {
            this._triggerElement.focus();
            this._triggerElement = null;
        }
    }

    async handleDeleteConfirm() {
        try {
            await deleteEvent({ eventId: this.recordToDeleteId });
            this.showToast(
                'Success',
                'Event deleted successfully.',
                'success'
            );
            this.isDeleteModalOpen = false;
            this.recordToDeleteId = null;
            await refreshApex(this.wiredEventsResult);
            const addButton = this.template.querySelector(
                '.event-history__button--add'
            );
            if (addButton) {
                addButton.focus();
            }
        } catch (error) {
            this.showToast('Error', this.getErrorMessage(error), 'error');
        }
    }

    handleModalKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.isDeleteModalOpen) {
                this.closeDeleteModal();
            } else if (this.isFormModalOpen) {
                this.closeFormModal();
            }
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    getErrorMessage(error) {
        if (error?.body?.message) {
            return error.body.message;
        }
        if (error?.message) {
            return error.message;
        }
        return 'An unexpected error occurred.';
    }
}

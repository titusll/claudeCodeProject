public with sharing class EventHistoryController {

    @AuraEnabled(cacheable=true)
    public static List<Event__c> getEvents(String ownerId) {
        if (String.isBlank(ownerId)) {
            return new List<Event__c>();
        }
        return [
            SELECT Id, Name, Type__c, Status__c, Event_Date__c,
                   Venue__c, Venue__r.Name
            FROM Event__c
            WHERE OwnerId = :ownerId
            WITH SECURITY_ENFORCED
            ORDER BY Event_Date__c DESC
        ];
    }

    @AuraEnabled
    public static void deleteEvent(Id eventId) {
        if (eventId == null) {
            throw new AuraHandledException('Event Id is required.');
        }
        if (!Schema.sObjectType.Event__c.isDeletable()) {
            throw new AuraHandledException(
                'Insufficient permissions to delete Event records.'
            );
        }
        List<Event__c> events = [
            SELECT Id
            FROM Event__c
            WHERE Id = :eventId
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        if (events.isEmpty()) {
            throw new AuraHandledException('Event record not found.');
        }
        delete events;
    }
}

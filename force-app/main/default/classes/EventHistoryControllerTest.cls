@IsTest
private class EventHistoryControllerTest {

    @TestSetup
    static void setup() {
        List<Event__c> events = new List<Event__c>();
        for (Integer i = 0; i < 5; i++) {
            events.add(
                new Event__c(
                    Name = 'Test Event ' + i,
                    Type__c = 'Concert',
                    Status__c = 'Draft',
                    Event_Date__c = DateTime.now().addDays(i)
                )
            );
        }
        insert events;
    }

    @IsTest
    static void testGetEventsReturnsRecords() {
        String userId = UserInfo.getUserId();

        Test.startTest();
        List<Event__c> events = EventHistoryController.getEvents(userId);
        Test.stopTest();

        System.assertEquals(
            5,
            events.size(),
            'Should return 5 events for the current user'
        );
        for (Event__c evt : events) {
            System.assertNotEquals(
                null,
                evt.Name,
                'Event Name should be populated'
            );
        }
    }

    @IsTest
    static void testGetEventsBlankOwnerId() {
        Test.startTest();
        List<Event__c> events = EventHistoryController.getEvents('');
        Test.stopTest();

        System.assertEquals(
            0,
            events.size(),
            'Should return empty list for blank owner ID'
        );
    }

    @IsTest
    static void testGetEventsNullOwnerId() {
        Test.startTest();
        List<Event__c> events = EventHistoryController.getEvents(null);
        Test.stopTest();

        System.assertEquals(
            0,
            events.size(),
            'Should return empty list for null owner ID'
        );
    }

    @IsTest
    static void testGetEventsOrderedByDateDesc() {
        String userId = UserInfo.getUserId();

        Test.startTest();
        List<Event__c> events = EventHistoryController.getEvents(userId);
        Test.stopTest();

        for (Integer i = 0; i < events.size() - 1; i++) {
            System.assert(
                events[i].Event_Date__c >= events[i + 1].Event_Date__c,
                'Events should be ordered by date descending'
            );
        }
    }

    @IsTest
    static void testDeleteEvent() {
        Event__c evt = [SELECT Id FROM Event__c LIMIT 1];

        Test.startTest();
        EventHistoryController.deleteEvent(evt.Id);
        Test.stopTest();

        List<Event__c> remaining = [
            SELECT Id
            FROM Event__c
            WHERE Id = :evt.Id
        ];
        System.assertEquals(0, remaining.size(), 'Event should be deleted');
    }

    @IsTest
    static void testDeleteEventNullId() {
        Test.startTest();
        try {
            EventHistoryController.deleteEvent(null);
            System.assert(false, 'Should have thrown an AuraHandledException');
        } catch (AuraHandledException e) {
            System.assertEquals(
                'Event Id is required.',
                e.getMessage(),
                'Error message should match'
            );
        }
        Test.stopTest();
    }

    @IsTest
    static void testDeleteEventNotFound() {
        Event__c evt = [SELECT Id FROM Event__c LIMIT 1];
        Id eventId = evt.Id;
        delete evt;

        Test.startTest();
        try {
            EventHistoryController.deleteEvent(eventId);
            System.assert(false, 'Should have thrown an AuraHandledException');
        } catch (AuraHandledException e) {
            System.assertEquals(
                'Event record not found.',
                e.getMessage(),
                'Error message should match'
            );
        }
        Test.stopTest();
    }
}

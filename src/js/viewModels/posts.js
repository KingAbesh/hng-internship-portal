define([
  "knockout",
  "ojs/ojbootstrap",
  "ojs/ojmodel",
  "ojs/ojcollectiondataprovider",
  "text!../cookbook/dataCollections/listView/collectionListView/tweets.json",
  "MockPagingRESTServer",
  "ojs/ojknockout",
  "ojs/ojlistview",
  "mockjax"
], function(
  ko,
  Model,
  CollectionDataProvider,
  jsonDataStr,
  MockPagingRESTServer
) {
  function postViewModel() {
    this.dataProvider = ko.observable();

    this.collection = null;

    // responseTime is only added so that the activity indicator is more noticeable
    var server = new MockPagingRESTServer(
      { Tweets: JSON.parse(jsonDataStr) },
      { collProp: "Tweets", id: "source", responseTime: 1000 }
    );

    var model = Model.Model.extend({
      idAttribute: "source"
    });

    var collection = new Model.Collection(null, {
      url: server.getURL(),
      fetchSize: 15,
      model: model
    });

    this.collection = collection;
    this.dataProvider(new CollectionDataProvider(collection));
  }
  return new postViewModel();
});

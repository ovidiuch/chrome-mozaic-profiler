var port;
var reloadTimeout;

var startLoading = function() {
  $('.loading').show();
  $('.no-mozaic').hide();
  $('.reload').hide();
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    reloadTimeout = null;
  }
};

var finishLoading = function(noMozaic) {
  $('.loading').hide();
  if (noMozaic) {
    $('.no-mozaic').show();
    $('.reload').hide();
  } else {
    $('.no-mozaic').hide();
    $('.reload').show();
  }
};

var populateColumn = function(id, data, itemCallback) {
  $count = $(id).find('.count');
  $list = $(id).find('ul');
  $count.html(data.length);
  $list.empty();
  for (var i = 0; i < data.length; i++) {
    $item = $('<li></li>');
    $item.html(itemCallback(data[i]));
    $list.append($item);
  }
};

var initBackgroundPort = function() {
  /*
    Connect with the background script of this extension (the mediator between
    the opened page and the devtools panel). The tab id is used to map each
    devtools instance to its corresponding tabs, since the background script
    manages all tabs at the same time
  */
  port = chrome.runtime.connect({
    name: 'mozaic-' + chrome.devtools.inspectedWindow.tabId
  });
  // Handle messages from the background script
  port.onMessage.addListener(function(msg) {
    // There's only one type of message for now (action: 'refresh')
    checkIfMozaicIsInstalled();
  });
};

var checkIfMozaicIsInstalled = function() {
  /*
    First check if Mozaic.js is used in the inspected window, only after that
    request more data
   */
  startLoading();

  applyFunctionOnInspectedWindow(checkMozaicNamespace, function(response) {
    if (!response) {
      finishLoading(true);
    } else {
      finishLoading();
      // Immediately start fetching Mozaic data
      loadMozaicData();
    }
  });
};

var loadMozaicData = function() {
  startLoading();

  applyFunctionOnInspectedWindow(gatherMozaicData, function(result) {
    finishLoading();
    $('.timestamp').text(result.error || result.timestamp);

    populateColumn('.all-widgets', result.allWidgets, function(widget) {
      return ('<span class="left">' + widget.name + '</span>' +
              '<span class="right">' + widget.id + '</span>');
    });
    populateColumn('.widget-types', result.widgetTypes, function(type) {
      return ('<span class="left">' + type.name + '</span>' +
              '<span class="right">' + type.widgets.length + '</span>');
    });
    populateColumn('.all-channels', result.allChannels, function(channel) {
      return ('<span class="left">' + channel.id + '</span>' +
              '<span class="right">' + (channel.models || 'N/A') + '</span>');
    });
    populateColumn('.channel-types', result.channelTypes, function(type) {
      return ('<span class="left">' + type.name + '</span>' +
              '<span class="right">' + type.channels.length + '</span>');
    });
    // Program a new reload in 2 seconds
    reloadTimeout = setTimeout(loadMozaicData, 2000);
  });
};

$(function() {
  startLoading();

  // Init events
  $('.reload').click(function(e) {
    e.preventDefault();
    loadMozaicData();
  });
  // Only init background port as the DOM is loaded in order to have it ready
  // for displaying stats immediately
  initBackgroundPort();
});

var App = {
	apiKey: "AIzaSyBgdS5DoClQNIFZHTJ8CYnxOd3dBYRa8vY", 
	ytBaseVideoUrl: "https://www.youtube.com/watch?v="
}

var nbFetched = 0;
var nbSongs = 0;
var videos = [];

function init() {
	gapi.client.load('youtube', 'v3');
	gapi.client.setApiKey(App.apiKey);
	$('#search').click(parseSongsList);
}

function parseSongsList() {
	var songs = $('#songs').val().split("\n");
	nbSongs = songs.length;
	$('#log').empty()
	for(var i in songs) {
		lookupSong(songs[i]);
	}
}

function lookupSong(query) {
	var request = gapi.client.youtube.search.list({
	   q: query,
	   part: 'snippet', 
	 });

	request.execute(handleYoutubeResults)	
}

function handleYoutubeResults(results) {
	++nbFetched;

	var bestResult = results.items[0];
	var videoId = bestResult.id.videoId;
	var url = App.ytBaseVideoUrl + videoId;
	/*var $link = linkFor(url, bestResult.snippet.title)
	$('#log').append($link)*/

	$.tmpl($("#song_tpl"), {
		id: videoId, 
		title: bestResult.snippet.title, 
		progress: 0
	}).appendTo($('#log'))

	//loaderContainerFor(videoId).insertAfter($link)
	console.log(bestResult.snippet)
	videos.push({
		url: url,
		title: bestResult.snippet.title, 
	})

	if(nbFetched == nbSongs) {
		initConversion();
	}
}

function linkFor(url, text) {
	return $('<a></a>').attr("href", url).text(text).prepend("<br />");
}

function loaderContainerFor(videoId) {
	var $el = $('<span></span>').attr("id", videoId+"_loaderContainer")
	return $el;
}

/* */
function initConversion() {
	var socket = io.connect('http://localhost')
	socket.emit('init', videos)
	socket.on('progress', function(data) {
		$('#log')
			.find('#song_' + data.videoId + ' .progress-bar')
			.css('width', data.progress+"%")

		/*var $el = $('#log').find('#song_' + data.videoId + ' .progress');
		$el.text(data.progress+" %")
		if(data.progress == 100) {
			$el.html("&nbsp;Done !");
		}*/
	})

	socket.on('done', function(zipUrl) {
		$.tmpl($('#result_tpl'), {
			url: zipUrl
		}).appendTo($('#log'))
		//$('#result').html(linkFor(zipUrl, ">> Download your music <<")).show()
	})
}
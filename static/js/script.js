var App = {
	apiKey: "AIzaSyBgdS5DoClQNIFZHTJ8CYnxOd3dBYRa8vY", 
	ytBaseVideoUrl: "https://www.youtube.com/watch?v="
}

var nbFetched = 0;
var nbSongs = 0;
var videos = [];
var quality = 0;

function init() {
	gapi.client.load('youtube', 'v3');
	gapi.client.setApiKey(App.apiKey);
	$('#search').click(parseSongsList);
	$('#launch-conversion').click(initConversion)
}

function parseSongsList() {
	$('#search_container').slideUp(700, function() {
		$('#launch-conversion').css('visibility', 'visible')
	})

	quality = $('#quality').find(':selected').attr('value')
	var songs = $('#songs_textarea').val().split("\n")//.reverse();
	nbSongs = songs.length;
	$('#log').empty()
	for(var i in songs) {
		if(songs[i].trim().length > 0) {
			lookupSong(songs[i]);
		}
	}

	return false
}

function lookupSong(query) {
	var request = gapi.client.youtube.search.list({
	   q: query,
	   part: 'snippet', 
	   maxResults: 5
	 });

	request.execute(handleYoutubeResults)	
}

function handleYoutubeResults(results) {
	++nbFetched;

	var bestResult = results.items[0];
	var videoId = bestResult.id.videoId;
	var url = App.ytBaseVideoUrl + videoId;

	var $newSong = $.tmpl($("#song_tpl"), {
		id: videoId, 
		title: bestResult.snippet.title, 
		progress: 0
	}).appendTo($('#songs'))

	for(var i in results.items) {
		var result = results.items[i];
		var $result = $.tmpl($('#youtube_results_tpl'), {
			duration: "0:00", 
			title: result.snippet.title, 
			thumbnail_url: result.snippet.thumbnails.default.url, 
			url: App.ytBaseVideoUrl + result.id.videoId
		}).appendTo($newSong.find('.youtube-results'))

		if(i == 0) {
			$result.addClass('selected');
		}

		$result.click(function($song) {
			$(this).parent().find('.youtube-result.selected').each(function() {
				$(this).removeClass('selected');
			})
			$song.find('.panel-title').text($(this).find('.title').text());
			$(this).toggleClass('selected');

		}.bind($result, $newSong))
	}

	videos.push({
		url: url,
		title: bestResult.snippet.title, 
	})

	if(nbFetched == nbSongs) {
		$('.toggle-header').click(function() {
			var $el = $(this).find('.glyphicon')
			$el.toggleClass('glyphicon-chevron-right', 'glyphicon-chevron-down')
			$el.toggleClass('glyphicon-chevron-down', 'glyphicon-chevron-right')
		})
	}
}

// Get wanted URLs from selected videos
function getVideos() {
	var videos = []
	$('.song-container').each(function() {
		var infos = {}
		infos.title = $(this).find('.panel-title').text()
		infos.refId = $(this).find('.panel-heading').first().attr('data-ref-id')
		infos.url = $(this).find('.youtube-result.selected').first().attr('data-url');
		videos.push(infos)
	})
	console.log(videos)
	return videos
}

function collapseYoutubeResults() {
	$('.song-results').removeClass('in')
	$('.song-results').collapse()
}


function initConversion() {
	collapseYoutubeResults();
	$('.progress').removeClass('hidden');
	$('#launch-conversion').fadeOut(200)
	$('body').find('.progress-percentage')
			.text("Starting...")
	var videos = getVideos();
	var socket = io.connect(window.location.href)
	socket.emit('init', {
		videos: videos, 
		quality: quality
	})
	socket.on('progress', function(data) {
		console.log(data.progress)
		var $song = $('#songs').find('#song_' + data.videoId)
		var $progressBar = $song.find('.progress-bar')
		var $progress = $song.find('.progress-percentage')
		$progressBar.css('width', data.progress+'%')
		$progress.text(data.progress + " %")
		if(data.progress >= 100) {
			$progressBar.removeClass('active')
			$progressBar.removeClass('progress-bar-striped')
			$progressBar.text("Done")
		}
	})

	socket.on('done', function(result) {
		$.tmpl($('#result_tpl'), {
			url: result.url, 
			size: Math.round(100 *result.size / (1024 * 1024)) / 100
		}).appendTo($('#log'))
	})

	socket.on('error', function(err) {
		console.log("error")
		var $err = $.tmpl($('#error_tpl'), {
			err: err
		})
		$('#msg_container').append($err)
	})
}
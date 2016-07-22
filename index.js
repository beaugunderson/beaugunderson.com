/*global _:true, $:true sprintf:true EmojiConvertor:true*/

'use strict';

var emoji;

function commafy(i) {
  return i.toString().replace(/(^|[^\w.])(\d{4,})/g, function($0, $1, $2) {
    return $1 + $2.replace(/\d(?=(?:\d\d\d)+(?!\d))/g, '$&,');
  });
}

function htmlEncode(html) {
  return document.createElement('a').appendChild(
    document.createTextNode(html)).parentNode.innerHTML;
}

function groupedProjects(data, element, options) {
  if (!options) {
    options = {};
  }

  data.map(function (language) {
    var projects = _(language.repos)
      .filter(function (project) {
        return !(/deprecated-/.test(project.name));
      })
      .map(function (project) {
        if (!project.description) {
          project.description = '';
        }

        project.description = emoji.replace_colons(emoji.replace_unified(
          htmlEncode(project.description)));

        if (options.rename) {
          project.name = project.name.replace(/^node-/, '');
        }

        return project;
      })
      .sortBy(function (project) {
        if (options.commits) {
          return -project.percentage;
        }

        return project.name.toLowerCase();
      })
      .map(function (project) {
        if (options.commits) {
          project.description = sprintf(
            '<small title="%d of %d commits">%0.1f%%</small> %s',
            project.mine,
            project.total,
            project.percentage * 100,
            project.description);
        }

        return sprintf('<li><strong><a href="%s">%s</a></strong> %s</li>',
                       project.html_url, project.name, project.description);
      })
      .join('\n');

    return sprintf('<li><strong class="language">%s</strong> ' +
                   '<strong><small>%d</small></strong> ' +
                   '<ul class="list">%s</span></ul>',
                   language.name, language.count, projects);
  }).forEach(function (language) {
    $(language).appendTo(element);
  });
}

function addRepositories(repositories) {
  $('#total-projects').text(repositories.total + ' projects');

  $('.projects').html('');

  $('#commits').text('(' + commafy(repositories.totalCommits) + ' commits)');

  $('#own-projects').text(repositories.sourcesTotal);
  $('#contributed-projects').text(repositories.forksTotal);
  $('#organization-projects').text(repositories.orgTotal);

  groupedProjects(repositories.sources, '#sources', {rename: true});
  groupedProjects(repositories.forks, '#forks');
  groupedProjects(repositories.org, '#organization', {commits: true});
}

$(function () {
  emoji = new EmojiConvertor();

  emoji.img_sets.apple.path = '/emoji/emoji-data/img-apple-64/';
  emoji.img_sets.apple.sheet = '/emoji/emoji-data/sheet_apple_64.png';

  $.getJSON('/status/email/', function (result) {
    $('#read').text(result.read);
    $('#unread').text(result.unread);
  });

  $.getJSON('/status/github/', function (json) {
    addRepositories(json);
  });
});

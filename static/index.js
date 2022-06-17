(function($) {

let galleryTemplate = null;
let fieldMap = {
  'Title':    'Title',
  'Summary':  'Summary',
  'Placename':'Placename',
  'Lat':      'Lat',
  'Lon':      'Lon',
  'Category': 'Category',
  'Details':  'Details',
  'Link':     'Link',
  'Name':     'Name',
  'Images':   'Images',
  'Date':     'Date'
};
BASE_FIELDS.forEach((item) => {
  kv = item.split('=');
  if (kv.length < 2) return;
  fieldMap[kv[0]] = kv[1].trim();
});

const $gallery = $('#gallery');
const $filters = $('#filters');
const $searchform = $('form#search');
const $pagination = $('#pagination');

let thePage = 1, perPage = 3, totalItems = 0;
let originalData = null, fetchTimeout = null, theQuery = null;

function delay(fn, ms) {
  let timer = 0
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(fn.bind(this, ...args), ms || 0)
  }
}

function parseRowData(row) {
  // Check data completeness
  if (!row.data[fieldMap['Title']])
    return null;

  // Parse essential fields
  let rowdata = {
      fields: [],
      date: row.data[fieldMap['Date']],
      title: row.data[fieldMap['Title']],
      address: row.data[fieldMap['Placename']],
      summary: row.data[fieldMap['Summary']],
      name: row.data[fieldMap['Name']],
      detailurl: row.data[fieldMap['Link']],
  };

  // Check embedded image
  const bilder = row.data[fieldMap['Images']];
  rowdata.imageurl = (
    !bilder || bilder.length == 0 ?
      false :
      bilder[0].url
    );

  // Pretty print the date
  rowdata.moment = (
    rowdata.date ?
       moment(row.data[fieldMap['Date']]).format('MMM D') :
       null
    );

  // Assign local link if available, else global
  if (!row.data[fieldMap['Link']])
    rowdata.detailurl = (
      BASE_DETAIL_URL == '' ?
        null :
        BASE_DETAIL_URL + '/' + row.id + '?blocks=hide'
      );

  // Set up data for the popup
  POPUP_FIELDS.forEach(function(f) {
      let v = row.data[f];
      let fulltext = fulllist = null;
      if (typeof v == 'number') {
        // Number field - regional formatting?
      } else if (typeof v == 'object' && v.length > 0) {
        // Array
        fulllist = v;
        v = '';
      } else if (typeof v == 'string') {
        if (v.length > MAX_FIELD_LENGTH) {
          fulltext = v;
          v = v.replace(new RegExp("(.{1," + MAX_FIELD_LENGTH + "})(?:\s|$)"), "$1\n");
          v = v.split('\n')[0];
        }
      } else {
        v = null; // skip unknown value
      }
      if (!v && !fulllist && !fulltext) {
        return console.warn('Skipping field', f, typeof v);
      }
      rowdata.fields.push({
          id: f.toLowerCase().replace(' ', '-'),
          name: f,
          data: v,
          fulllist: fulllist,
          fulltext: fulltext,
      })
  });

  return rowdata;
}

function renderItems(data) {
  $gallery.empty();

  data.forEach(function(row) {
    // console.debug("Row:", row);
    const rd = parseRowData(row);
    if (rd === null) return;
    $gallery.append(
      // Prepare HTML for the pop-up
      Mustache.render(galleryTemplate, rd)
    );
  }); // -data.forEach

  thePage = 1;
  totalItems = data.length;

  if (totalItems > perPage) {
    $pagination.removeClass('hidden');
  } else {
    $pagination.addClass('hidden');
  }

  function setPageVisible() {
    // Set results visibility
    $gallery.children().each(function(el, ix) {
      $(el).removeClass('hidden');
      if (ix < (thePage-1) * perPage || ix >= thePage * perPage) {
        $(el).addClass('hidden');
      }
    });

    // Button visibility
    $pagination.find('.page-next,.page-prev').removeClass('disabled');
    if (thePage * perPage >= totalItems) {
      $pagination.find('.page-next').addClass('disabled');
    }
    if (thePage == 1) {
      $pagination.find('.page-prev').addClass('disabled');
    }
  }
  $pagination.find('a').on('click', function(e) {
    e.preventDefault();
    if ($(this).parent().hasClass('disabled')) return;

    // Update page
    if ($(this).parent().hasClass('page-next')) {
      thePage++;
    } else if ($(this).parent().hasClass('page-prev')) {
      thePage--;
    }

    // console.log(thePage, perPage, totalItems);
    setPageVisible();
  });
  setPageVisible();

} // -renderItems

fetch('static/widgets/gallery.mustache')
.then((response) => response.text())
.then((template) => {
  galleryTemplate = template;

  fetch("/items")
    .then((response) => response.json())
    .then((data) => {

    allFields = {};
    data.forEach(function(row) {
      const rd = parseRowData(row);
      if (rd === null) return;
      rd.fields.forEach(function(fld) {
        if (Object.keys(allFields).indexOf(fld.id)<0) {
          allFields[fld.id] = { name: fld.name, keys: [] };
        }
        if (fld.fulllist !== null) {
          fld.fulllist.forEach(function(flddata) {
            if (allFields[fld.id].keys.indexOf(flddata)<0) {
              allFields[fld.id].keys.push(flddata);
            }
          });
        } else if (fld.data !== '') {
          if (allFields[fld.id].keys.indexOf(fld.data)<0) {
            allFields[fld.id].keys.push(fld.data);
          }
        }
      });
    });
    const $filterFld = $filters.find('.fields').empty();
    Object.keys(allFields).forEach(function(ftype) {
      const fltr = allFields[ftype];
      $filterFld.append('\
        <a class="fld ' + ftype + '" title="' + fltr.name + '"></a>\
      ');
      fltr.keys.forEach(function(fld) {
        $filterFld.find('.' + ftype).append('\
          <span>' + fld + '</span>\
        ')
      });
    });
    if ($filterFld.find('span').nodes.length > 0) {
      $filters.find('button').on('click', function() {
        $filters.find('div.hidden').removeClass('hidden');
        $(this).addClass('hidden');
      });
    } else {
      // hide button if no filters
      $filters.find('button').addClass('hidden');
    }
    $filterFld.find('span').on('click', function() {
      // Select one
      $(this).siblings().removeClass('active');

      // Select multiple
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
      } else {
        $(this).addClass('active');
      }

      if (fetchTimeout !== null &&
        new Date() - fetchTimeout < 500) return;
      fetchTimeout = new Date();

      let theQuery = [];
      $filterFld.find('span.active').nodes.forEach(function(n) {
        theQuery.push(
          $(n).parent().attr('title') + ':' + $(n).text()
        );
      });
      const theQueryURI = encodeURIComponent(theQuery.join(','));
      fetch("/filter?q=" + theQueryURI)
        .then((response) => response.json())
        .then((data) => {
          renderItems(data);
      }); // -fetch search
    });

    $searchform.find('input').on('keydown,change', function(event) {
      delay($searchform.trigger('submit'), 1000);
    });

    $searchform.handle('submit', function(event) {
      // Minimum query length
      const q = $searchform.find('input').nodes[0].value;
      if (q.length <3 || q.trim() == theQuery) return;

      // Timeout check
      if (fetchTimeout !== null &&
        new Date() - fetchTimeout < 500) return;
      fetchTimeout = new Date();

      theQuery = q.trim();
      fetch("/search?q=" + theQuery)
        .then((response) => response.json())
        .then((data) => {
          renderItems(data);
          delay($searchform.trigger('submit'), 1000);
      }); // -fetch search
    }) // -on searchform

    originalData = data;
    $searchform.find('.cancel-search').on('click', function(event) {
      event.preventDefault();
      $filterFld.find('span.active').removeClass('active');
      $searchform.find('input').nodes[0].value = '';
      renderItems(originalData);
    });

    if (!START_EMPTY) {
      renderItems(data);
    }
  }); // -fetch items
}); // -fetch template

}(u));

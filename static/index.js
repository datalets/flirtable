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
const $searchform = $('form#search');
const $pagination = $('#pagination');

let thePage = 1, perPage = 3, totalItems = 0;
let originalData = null, fetchTimeout = null;

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
      if (ix < (thePage-1) * perPage || ix >= thePage * perPage) {
        $(el).addClass('hidden');
      } else {
        $(el).removeClass('hidden');
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

    if (!START_EMPTY) {
      renderItems(data);
    }
    originalData = data;

    $searchform.find('.cancel-search').on('click', function(event) {
      event.preventDefault();
      $searchform.find('input').nodes[0].value = '';
      renderItems(originalData);
    });

    $searchform.find('input').on('keydown', function(event) {
      $searchform.trigger('submit');
    });

    $searchform.handle('submit', function(event) {
      // Minimum query length
      const q = $searchform.find('input').nodes[0].value;
      if (q.length <3) return;

      // Timeout check
      if (fetchTimeout !== null &&
        new Date() - fetchTimeout < 1000) return;
      fetchTimeout = new Date();

      fetch("/search?q=" + q)
        .then((response) => response.json())
        .then((data) => {
          $gallery.empty();
          renderItems(data);
      }); // -fetch search

    }) // -on searchform
  }); // -fetch items
}); // -fetch template

}(u));

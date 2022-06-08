

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
let originalData = null;

function renderItems(data) {

  data.forEach(function(row) {
    // console.debug("Row:", row);

    // Check data completeness
    if (!row.data[fieldMap['Title']]) return;
    const bilder = row.data[fieldMap['Images']];

    // Parse essential fields
    let rowdata = {
        fields: [],
        moment: row.data[fieldMap['Date']] ? moment(row.data[fieldMap['Date']]).format('MMM D') : null,
        title: row.data[fieldMap['Title']],
        address: row.data[fieldMap['Placename']],
        summary: row.data[fieldMap['Summary']],
        name: row.data[fieldMap['Name']],
        detailurl: row.data[fieldMap['Link']] ? row.data[fieldMap['Link']] : (
            BASE_DETAIL_URL == '' ? null :
                BASE_DETAIL_URL + '/' + row.id + '?blocks=hide'
            ),
        imageurl: (!bilder || bilder.length == 0) ? false :
            bilder[0].url
    };

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

    $gallery.append(
      // Prepare HTML for the pop-up
      Mustache.render(galleryTemplate, rowdata)
    );
  }); // -data.forEach

  thePage = 1;
  totalItems = data.length;
  if (totalItems > perPage) {
    $pagination.show();
  } else {
    $pagination.hide();
  }
  function setPageVisible() {
    $gallery.children().each(function(ix) {
      if (ix >= thePage * perPage || ix < (thePage-1) * perPage) {
        $(this).addClass('hidden');
      } else {
        $(this).removeClass('hidden');
      }
    });
  }
  $pagination.find('a').click(function(e) {
    e.preventDefault();
    if ($(this).parent().hasClass('disabled')) return;

    // Update page
    if ($(this).parent().hasClass('page-next')) {
      thePage++;
    } else if ($(this).parent().hasClass('page-prev')) {
      thePage--;
    }

    // console.log(thePage, perPage, totalItems);

    // Update visibility
    $pagination.find('.page-next,.page-prev').removeClass('disabled');
    if (thePage * perPage >= totalItems) {
      $pagination.find('.page-next').addClass('disabled');
    }
    if (thePage == 1) {
      $pagination.find('.page-prev').addClass('disabled');
    }

    setPageVisible();
  });
  setPageVisible();

} // -renderItems

fetch('static/widgets/gallery.mustache')
.then((response) => response.text())
.then((template) => {
  galleryTemplate = template;

  $.get("/items", function(data) {

    renderItems(data);
    originalData = data;

    $searchform.find('.cancel-search').click(function(event) {
      event.preventDefault();
      $searchform.find('input').val('');
      renderItems(originalData);
    });

    $searchform.on('submit', function(event) {
      event.preventDefault();
      event.stopPropagation();

    // });
    // $searchform.find('input').on('keyup', function(event) {

      const q = $searchform.find('input').val();
      if (q.length <3) return;

      $.get("/search?q=" + q, function(data) {
        $gallery.empty();
        renderItems(data);
      });
    })
  }); // -get(data)
}); // -fetch template

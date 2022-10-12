Flirtable
---

This is a web component used to visualize the data of an [Airtable](https://airtable.com) with search, filtering and mapping functionality.

![Screenshot](static/screenshot.jpg)

# Getting started

The underlying project can be used to create a web application out of a Table with a particular structure:

- **Title** - the headline of an item or location
- **Summary** - a short text for an overlay or gallery
- **Placename** - an address or other bit of information
- **Lat** - the latitude of the location
- **Lon** - the longitude of the location
- **Category** - for a map legend or filters
- **Details** - free text for a larger popup
- **Link** - URL to link to instead of the popup
- **Images** - attachments used as a thumbnail

Use these default column names in your Table, or configure a translation of any of your differing column names with a `BASE_FIELDS` parameter like this (to use "Name" instead of "Title", etc.):

`Title=Name;Summary=Headline;Link=URL;Images=Bilder`

## Map view

Points on the map for each row along with a details popup on tap are shown. Right clicking anywhere on the map shows the current latitude and longitude, which is helpful if you want to add new points to your spreadsheet without geocoding.

A legend is automatically generated from the category field. An optional button, "Add", can link to an Airtable form where new data points can be added. The data is refreshed by tapping "Refresh" and your current position can be shown with the target button.

## Gallery view

This is a grid of squares, inspired from Airtable's own gallery.

# Getting started

The following environment keys can be used to configure this project:

- `AIRTABLE_BASE`, `AIRTABLE_TABLE` and `AIRTABLE_KEY` from the [Airtable API](https://airtable.com/api)
- `AIRTABLE_FORM` (optional) is the URL of the shared add (Form) view
- `AIRTABLE_LINK` (optional) is the URL of the shared detail (Gallery) view
- `MAPBOX_KEY` (optional) for map view - get an [access token](https://docs.mapbox.com/api/#access-tokens-and-token-scopes) first
- `BASE_FIELDS` (optional) are the mapping of your column names to the standard ones, as described above
- `POPUP_FIELDS` (optional) are a comma-delimited list of columns which are shown in the detail pop-up
- `REQUIRED_FIELDS` (optional) are a comma-delimited list of columns which are required for row to be shown
- `SORT_KEY` (optional) to indicate which column to sort on, prefixed with - to reverse the order
- `START_EMPTY` (optional) set to 1 if you do not want any results visible on loading

## Deployment

These can be added using Heroku's add project or Settings interface:

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/datalets/flirtable)

Or through the environment variables on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/datalets/flirtable)

## Tech stack

* [Airtable](https://airtable.com) for super-spreadsheets
* [Flask-API](http://www.flaskapi.org/) to create a basic API
* [Flask](https://flask.palletsprojects.com/) is a [Python](https://python.org) web framework
* [Mustache](https://github.com/janl/mustache.js/) UI templating
* [Zepto](https://zeptojs.com/) UI tooling
* [Gunicorn](https://gunicorn.org/) web server support
* [Leaflet.js](https://leafletjs.com/) geodata mapping
* [OpenStreetMap](https://osm.ch) via [Mapbox](https://mapbox.com/) as map base

### Project structure

| Location                |  Content                             |
|-------------------------|--------------------------------------|
| `/data`                 | Sample data structure                |
| `/static`               | Frontend resources                   |
| `/templates`            | Web templates                        |
| `/index.py`             | Flask API (`/api`)                   |

# Contributing

First, clone this repository and make sure to set up the following dependencies:

- [X] [Python 3](https://python.org)
- [X] [Poetry](https://python-poetry.org/docs/)
- [X] [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) or [Vercel CLI](https://vercel.com/download) (optional)

Setup a virtual environment, install dependencies, and activate it using Poetry:

```
$ poetry shell
$ poetry install
```

Create a file called `.flaskenv` (or `.env` if using gunicorn in production) in the root folder and add development settings and required keys from the Configuration section above - for example:

```
BASE_FIELDS="Title=Name;Summary=Headline;Link=URL;Images=Logo"
POPUP_FIELDS=Category,Details,Relevance
SORT_KEY=Headline

AIRTABLE_BASE=...
AIRTABLE_KEY=...
AIRTABLE_TABLE=...

AIRTABLE_LINK=https://airtable.com/shr...
AIRTABLE_FORM=https://airtable.com/shr...

MAPBOX_KEY=pk...

# Required to use Flask cli
FLASK_APP=index.py

# When not in production:
FLASK_ENV=development
FLASK_DEBUG=true
```

Now start the development server:

```
$ flask run
```

- The API will be served from http://localhost:5000/items/
- The frontend will be served from http://127.0.0.1:5000/

### Dependency management

We are using poetry (and GitHub bots) to keep this project up to date. To check if you have the latest versions of upstream libraries, run:

`poetry update`

Heroku's buildpack currently does not support loading Python dependencies from poetry automatically. [We're working on it](https://github.com/heroku/heroku-buildpack-python/issues/796#issuecomment-611198469) ... in the meantime, please remember to run this command after upgrading dependencies:

`poetry export -f requirements.txt --without-hashes > requirements.txt`

(* If you include hashes, vercel complains about setuptools)

# History

Originally developed by @loleg as part of the [Urbane Dörfer](https://www.urbanedoerfer.ch/) project.

Thanks to contributions from @Brieden and @Ceeced

# License

[MIT License](LICENSE.md)

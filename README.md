# Standortanalyse

This is a web based visualization of location data in an Airtable, developed as part of the [Urbane Dörfer](https://www.urbanedoerfer.ch/) project.

### Components

* [Airtable](https://airtable.com) super-spreadsheets
* [Flask](https://flask.palletsprojects.com/), a [Python](https://python.org) web framework
* [Flask-API](http://www.flaskapi.org/) API layer
* [Leaflet.js](https://leafletjs.com/reference-1.6.0.html) mapping
* [Mustache](https://github.com/janl/mustache.js/) templating
* [Zepto](https://zeptojs.com/) UI tooling
* [Gunicorn](https://gunicorn.org/) web server support
* [Heroku](https://heroku.com) deployment support

### Project structure

| Location                |  Content                             |
|-------------------------|--------------------------------------|
| `/data`                 | Sample data structure                |
| `/static`               | Frontend resources                   |
| `/templates`            | Frontend templates                   |
| `/app.py`               | Flask API (`/api`)                   |

## Configuration

The following environment keys can be used to configure this project:

- `MAPBOX_KEY` get an access token [here](https://docs.mapbox.com/api/#access-tokens-and-token-scopes) or [here](view-source:https://leafletjs.com/examples/choropleth/example.html) for the base layer
- `AIRTABLE_BASE`, `AIRTABLE_TABLE` and `AIRTABLE_KEY` from the [Airtable API](https://airtable.com/api)
- `AIRTABLE_FORM` (optional) is the URL of the shared add (Form) view
- `AIRTABLE_LINK` (optional) is the URL of the shared detail (Gallery) view
- `POPUP_FIELDS` (optional) are a comma-delimited list of columns which are shown in the detail pop-up
- `SORT_KEY` (optional) to indicate which column to sort on

These can be added using Heroku's add project or Settings interface:

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/loleg/standortanalyse)

## Installation

First, clone this repository and make sure to set up the following dependencies:

- [X] [Python 3](https://python.org)
- [X] [Poetry](https://python-poetry.org/docs/)
- [X] [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (optional)

Setup a virtual environment, install dependencies, and activate it:

```
$ poetry install
$ poetry shell
```

Create a file called `.flaskenv` in the root folder and add development settings and required keys from the Configuration section above - for example:

```
POPUP_FIELDS=Kategorie,Eingetragen,Notizen,Relevanz
SORT_KEY=Kategorie

AIRTABLE_BASE=...
AIRTABLE_KEY=...
AIRTABLE_TABLE=Standorte
AIRTABLE_LINK=https://airtable.com/shr...
AIRTABLE_FORM=https://airtable.com/shr...

MAPBOX_KEY=pk...

# When not in production:
FLASK_ENV=development
FLASK_DEBUG=true
```

### Dependency management

We are using poetry (and GitHub bots) to keep this project up to date. To check if you have the latest versions of upstream libraries, run:

`poetry update`

Heroku's buildpack currently does not support loading Python dependencies from poetry automatically. [We're working on it](https://github.com/heroku/heroku-buildpack-python/issues/796#issuecomment-611198469) ... in the meantime, please remember to run this command after upgrading dependencies:

`poetry export -f requirements.txt > requirements.txt`

Now start the development server (in a separate tab from Webpack):

```
$ flask run
```

- The API will be served from http://localhost:5000/items/
- The frontend application will be served from http://127.0.0.1:5000/app/

# Standortanalyse

WIP

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/loleg/standortanalyse)

### Components

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
| `/static`               | Frontend application                 |
| `/app.py`               | Flask API (`/api`)                   |

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

Create a file called `.flaskenv` in the root folder and add development settings:

```
SORT_KEY=Adresse (optional)
REQUIRED_FIELDS=Adresse (optional)
AIRTABLE_BASE=...
AIRTABLE_KEY=...
AIRTABLE_TABLE=Standorte

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

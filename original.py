# Setup the Jupyter version of Dash
from jupyter_dash import JupyterDash

# Configure the necessary Python module imports for dashboard components
import dash_leaflet as dl
from dash import dcc
from dash import html
import plotly.express as px
from dash import dash_table
from dash.dependencies import Input, Output, State
from dash.exceptions import PreventUpdate
import base64

# Configure OS routines
import os

# Configure the plotting routines
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from mongoCRUD import AnimalShelter

###########################
# Data Manipulation / Model
###########################

# Connect to database via CRUD Module
db = AnimalShelter()

df = pd.DataFrame.from_records(db.read({}))
df.drop(columns=['_id'], inplace=True)
columns = [{"name": i, "id": i, "deletable": False, "selectable": True} for i in df.columns]

#########################
# Dashboard Layout / View
#########################
app = JupyterDash(__name__)

image_filename = 'Grazioso-Salvare-Logo.png' 
encoded_image = base64.b64encode(open(image_filename, 'rb').read())

app.layout = html.Div([
    html.Center(html.A(
        href='https://snhu.edu',
        target='_blank',  # Open link in a new tab
        children=[
            html.Img(
                src='data:image/png;base64,{}'.format(encoded_image.decode()),
                style={'width': '10%'}
            )
        ]
    )),
    html.Center(html.B(html.H1('CS-340 Dashboard'))),
    html.Center(html.B(html.P('Colin Aheron'))),
    dcc.Dropdown(['Reset', 
                  'Water Rescue', 
                  'Mountain or Wilderness Rescue',
                  'Disaster or Individual Tracking'], 'Select Rescue Type', id='dropdown'),
    html.Hr(),
    html.Div(),
    html.Hr(),
    dash_table.DataTable(id='datatable-id',
                         columns=[{"name": i, "id": i, "deletable": False, "selectable": True} for i in df.columns],
                         data=df.to_dict('records'),
                         page_size=10,
                         sort_action='native',
                         row_selectable = "single",
                        ),
    html.Br(),
    html.Hr(),
    html.Div(className='row',
         style={'display' : 'flex'},
             children=[
        html.Div(
            id='graph-id',
            className='col s12 m6',
            ),
        html.Div(
            id='map-id',
            className='col s12 m6',
            )
        ])
])

#############################################
# Interaction Between Components / Controller
#############################################
    
@app.callback(Output('datatable-id', 'data'),
              [Input('dropdown', 'value')])
def update_dashboard(value):
    # Define the initial DataFrame and columns
    df = pd.DataFrame.from_records(db.read({}))
    df.drop(columns=['_id'], inplace=True)
    columns = [{"name": i, "id": i, "deletable": False, "selectable": True} for i in df.columns]

    if value == 'Reset':
        data = df.to_dict('records')
    elif value == 'Water Rescue':
        breeds = ["Labrador Retriever Mix", "Chesapeake Bay Retriever", "Newfoundland"]
        filtered_df = df[df['breed'].isin(breeds)]
        data = filtered_df.to_dict('records')
    elif value == 'Mountain or Wilderness Rescue':
        breeds = ["German Shepherd", "Alaskan Malamute", "Old English Sheepdog", "Siberian Husky", "Rottweiler"]
        filtered_df = df[df['breed'].isin(breeds)]
        data = filtered_df.to_dict('records')
    elif value == 'Disaster or Individual Tracking':
        breeds = ["Doberman Pinscher", "German Shepherd", "Golden Retriever", "Bloodhound", "Rottweiler"]
        filtered_df = df[df['breed'].isin(breeds)]
        data = filtered_df.to_dict('records')
    else:
        data = df.to_dict('records')

    return data

@app.callback(
    Output('graph-id', "children"),
    [Input('datatable-id', "data")])
def update_graphs(viewData):
    return [
        dcc.Graph(            
            figure = px.pie(df, names='breed', title='Preferred Animals')
        )    
    ]
    
@app.callback(
    Output('datatable-id', 'style_data_conditional'),
    [Input('datatable-id', 'selected_columns')]
)
def update_styles(selected_columns):
    if not selected_columns:
        return []
    return [{
        'if': { 'column_id': i },
        'background_color': '#D2F3FF'
    } for i in selected_columns]

@app.callback(
    Output('map-id', "children"),
    [Input('datatable-id', "derived_virtual_data"),
     Input('datatable-id', "derived_virtual_selected_rows"),
     Input('datatable-id', 'style_data_conditional')])
def update_map(derived_virtual_data, index, style_data_conditional):
    if not derived_virtual_data:
        raise PreventUpdate  

    dff = pd.DataFrame.from_dict(derived_virtual_data)

    if not index or len(index) == 0:
        row = 0
    else: 
        row = index[0]

    return [
        dl.Map(style={'width': '1000px', 'height': '500px'},
           center=[30.75,-97.48], zoom=10, children=[
           dl.TileLayer(id="base-layer-id"),
           dl.Marker(position=[dff.iloc[row,13],dff.iloc[row,14]],
              children=[
              dl.Tooltip(dff.iloc[row,4]),
              dl.Popup([
                 html.H1("Animal Name:"),
                html.H1(dff.iloc[row,9])
             ])
          ])
       ])
    ]

if __name__ == '__main__':
    app.run_server(debug=True)

#crimemx
Crime in Mexico Visualization using D3 and topojson

SNSP visualization with D3

Based on: http://bl.ocks.org/mbostock/9265674 To generate the states in topojson I used: https://gist.github.com/diegovalle/5129746 but with the 2013 downloaded from the INEGI link below

SHP states files: The Areas Geoestadísticas Estatales http://mapserver.inegi.org.mx/MGN/mge2013v6_0.zip available in here: http://www.inegi.org.mx/geo/contenidos/geoestadistica/M_Geoestadistico.aspx

Terminal Commands:

$ ogr2ogr states.shp Entidades_2013.shp -t_srs "+proj=longlat +ellps=WGS84 +no_defs +towgs84=0,0,0"

$ topojson -o mx_tj.json -s 1e-7 -q 1e5 states.shp -p state_code=+CVE_ENT,state_name=NOM_ENT

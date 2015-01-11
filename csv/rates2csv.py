#!/usr/bin/python
# -*- coding: utf-8 -*-
#usage rates2csv.py namefile, it generates a namefile.csv
from __future__ import print_function
import sys

#these 2 vars are to config
if (len (sys.argv)!= 2):
	sys.exit("Usage: rates2csv namefile (NOT with python)")

input_name = sys.argv[1]
output_name = sys.argv[1]+'.csv'
num_fields = 34
caracter = ','

output_file = ''

class Pdf2Table:
	line = '' #for the file to read
	fields_counter = 0

	def __init__(self):
		line = '' #for the file to read
		fields_counter = 0
		pass

	def print_header(self):
		print('year,0,1,2,3,4,7,8,5,6,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32', file=output_file)
		print('State,Total,Aguascalientes,Baja California,Baja California Sur,Campeche,Chiapas,Chihuahua,Coahuila de Zaragoza,Colima,Distrito Federal,Durango,Guanajuato,Guerrero,Hidalgo,Jalisco,Mexico,Michoacan,Morelos,Nayarit,Nuevo Leon,Oaxaca,Puebla,Queretaro,Quintana Roo,San Luis Potosi,Sinaloa,Sonora,Tabasco,Tamaulipas,Tlaxcala,Veracruz,Yucatan,Zacatecas', file=output_file)

	def add_field(self,field):
		self.fields_counter = self.fields_counter+1
		field = field.replace(',', '') #strip out commas
		field = -1 if field == '-' else field #converts - in -1
		if self.fields_counter <= num_fields:	
			self.line = self.line + str(field) + caracter
		else: #this is the last one
			self.line = self.line.rstrip(caracter)
			print(self.line, file=output_file) #finish the line
			self.line = field + caracter #unget
			self.fields_counter = 1
		return ''

with open(input_name,'r') as f:
	#build a line
	output_file = open(output_name,'w+')
	pt = Pdf2Table()
	pt.print_header()

	for line in f:
		line = line.strip('\n') #sin esto no funciona!
		pt.add_field(line)

	#print the last line
	pt.line = pt.line.rstrip(caracter)
	print(pt.line, file=output_file) #end the line

output_file.close()




#reads the 5 csv files and produces a json for each state
import csv
import datetime

def unix_time(dt):
    epoch = datetime.datetime(1970,1,1)
    delta = dt-epoch
    return delta.total_seconds()

def unix_time_millis(dt):
    return unix_time(dt) * 1000

def minus_one(num):
	if (num == '-1'):
		return '0'
	return num

fh = open('../csv/d3-homicide.csv', 'rb')
fk = open('../csv/d3-kidnap.csv', 'rb')
fe = open('../csv/d3-extortion.csv', 'rb')
fcv = open('../csv/d3-car-violence.csv', 'rb')
fcnv = open('../csv/d3-car-no-violence.csv', 'rb')

reader = csv.reader(fh)
readerk = csv.reader(fk)
readere = csv.reader(fe)
readercv = csv.reader(fcv)
readercnv = csv.reader(fcnv)

for i in range(2,34):
	year = 1996
	d = datetime.datetime(year,1,2)
	
	line={'homicide':'', 'kidnap':'', 'extortion':'', 'carvio':'', 'carnonvio':''}
	name=""
	
	year = 1996
	row_number = 0
	for row in reader:
		if (row_number!=0):
			if (row_number==1): #for the name
				name = row[i]
			if (row_number==2): #first line
				line['homicide']='{"key":"homicide","values" : ['
			line['homicide'] = line['homicide'] + "["+str(int(unix_time_millis(d))) + "," +minus_one(row[i]) + "],"
			year += 1
			d = datetime.datetime(year,1,2)
		row_number += 1

	year = 1996
	row_number = 0
	for row in readerk:
		if (row_number!=0):
			if (row_number==2): #first line
				line['kidnap']='{"key":"kidnap","values" : ['
			line['kidnap'] = line['kidnap'] + "["+str(int(unix_time_millis(d))) + "," +minus_one(row[i]) + "],"
			year += 1
			d = datetime.datetime(year,1,2)
		row_number += 1

	year = 1996
	row_number = 0
	for row in readere:
		if (row_number!=0):
			if (row_number==2): #first line
				line['extortion']='{"key":"extortion","values" : ['
			line['extortion'] = line['extortion'] + "["+str(int(unix_time_millis(d))) + "," +minus_one(row[i]) + "],"
			year += 1
			d = datetime.datetime(year,1,2)
		row_number += 1

	year = 1996
	row_number = 0
	for row in readercv:
		if (row_number!=0):
			if (row_number==2): #first line
				line['carvio']='{"key":"car with violence","values" : ['
			line['carvio'] = line['carvio'] + "["+str(int(unix_time_millis(d))) + "," +minus_one(row[i]) + "],"
			year += 1
			d = datetime.datetime(year,1,2)
		row_number += 1

	year = 1996
	row_number = 0
	for row in readercnv:
		if (row_number!=0):
			if (row_number==2): #first line
				line['carnonvio']='{"key":"car no violence","values" : ['
			line['carnonvio'] = line['carnonvio'] + "["+str(int(unix_time_millis(d))) + "," +minus_one(row[i]) + "],"
			year += 1
			d = datetime.datetime(year,1,2)
		row_number += 1

	if (name == 'Coahuila de Zaragoza'):
		name = 'Coahuila'
	wfile = open(name+'.json', 'w+')
	print name
	print >> wfile,"["+line['homicide'][:-1] + ']},'
	print >> wfile,line['kidnap'][:-1] + ']},'
	print >> wfile,line['extortion'][:-1] + ']},'
	print >> wfile,line['carvio'][:-1] + ']},'
	print >> wfile,line['carnonvio'][:-1] + ']}]'
	wfile.close()
	fh.seek(0)
	fk.seek(0)
	fe.seek(0)
	fcv.seek(0)
	fcnv.seek(0)
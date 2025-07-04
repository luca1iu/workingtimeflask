from flask import Flask, render_template, request, jsonify
from datetime import date, timedelta
import holidays
import pandas as pd


def extract_region_code(region_str):
    if not region_str:
        return ""
    return region_str.split("-")[0].strip().replace(" ", "")


def get_holidays_in_month(country_code, state=None):
    today = date.today()
    first_day = date(today.year, today.month, 1)

    # 计算当前月份的最后一天
    if today.month == 12:
        last_day = date(today.year, 12, 31)
    else:
        last_day = date(today.year, today.month + 1, 1) - timedelta(days=1)

    try:
        if state:
            country_holidays = holidays.country_holidays(country_code, subdiv=state)
        else:
            country_holidays = holidays.country_holidays(country_code)
    except Exception as e:
        print(f"Error: {e}")
        return []

    # 提取在本月内的节假日
    holidays_current_month = []
    working_days_current_month = []
    start_date = first_day
    while start_date <= last_day:
        if start_date in country_holidays:
            holidays_current_month.append(start_date)
        else:
            # identify if the date is working day or weekend
            if start_date.weekday() < 5:
                working_days_current_month.append(start_date)
        start_date += timedelta(days=1)

    return holidays_current_month, working_days_current_month


def get_holidays_in_specific_month(country_code, state=None, year=None, month=None):
    if year is None or month is None:
        today = date.today()
        year = today.year
        month = today.month
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year, 12, 31)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    try:
        if state:
            country_holidays = holidays.country_holidays(country_code, subdiv=state)
        else:
            country_holidays = holidays.country_holidays(country_code)
    except Exception as e:
        print(f"Error: {e}")
        return [], []
    holidays_current_month = []
    working_days_current_month = []
    start_date = first_day
    while start_date <= last_day:
        if start_date in country_holidays:
            holidays_current_month.append(start_date)
        else:
            if start_date.weekday() < 5:
                working_days_current_month.append(start_date)
        start_date += timedelta(days=1)
    return holidays_current_month, working_days_current_month


# today = date.today()
# holidays_current_month, working_days_current_month = get_holidays_in_month("DE", "NW")
# print(today)
# print(holidays_current_month)
# print(working_days_current_month)
#
# left_working_days = [day for day in working_days_current_month if day > today and day not in holidays_current_month]
# print(len(left_working_days))
from flask import Flask, render_template, request, jsonify
from datetime import date, timedelta
import holidays


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
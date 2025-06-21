from dateutil.utils import today
from app_functions import *
import json

app = Flask(__name__)


@app.route("/get_holidays", methods=["POST"])
def get_holidays():
    today = date.today()
    data = request.get_json()
    country_code = data.get("country")
    selected_region = extract_region_code(data.get("state"))
    print(f"Received request for country: {country_code}, region: {selected_region}")

    if not country_code or not selected_region:
        return jsonify({"error": "Missing parameters"}), 400

    holidays_current_month, working_days_current_month = get_holidays_in_month(country_code, selected_region)
    return jsonify({
        "region": selected_region,
        "holidays": holidays_current_month,
        "current_month": today.strftime("%B")
    })


@app.route("/", methods=["GET", "POST"])
def home():
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸", "currency": {"name": "USD", "symbol": "($)"}},
        "AU": {"name": "Australia", "flag": "🇦🇺", "currency": {"name": "AUD", "symbol": "(A$)"}},
        "DE": {"name": "Germany", "flag": "🇩🇪", "currency": {"name": "EUR", "symbol": "(€)"}},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧", "currency": {"name": "GBP", "symbol": "(£)"}},
        "CA": {"name": "Canada", "flag": "🇨🇦", "currency": {"name": "CAD", "symbol": "(C$)"}},
    }
    default_regions = {
        "US": "CA - California",
        "AU": "NSW - New South Wales",
        "DE": "NW - Nordrhein-Westfalen",
        "GB": "ENG - England",
        "CA": "ON - Ontario"
    }
    default_income = {
        "US": {"gross": 5000, "net": 4000},
        "AU": {"gross": 7000, "net": 5500},
        "DE": {"gross": 4500, "net": 3000},
        "GB": {"gross": 4800, "net": 3500},
        "CA": {"gross": 5200, "net": 4000}
    }
    if request.method == "POST":
        country = request.form.get("country", "US")
        state = request.form.get("state")
        gross = request.form.get("gross_income")
        net = request.form.get("net_income")
        start_time = request.form.get("start_time")
        end_time = request.form.get("end_time")
        onboard_date = request.form.get("onboard_date")
    else:
        country = "US"
        state = default_regions[country]
        gross = default_income[country]["gross"]
        net = default_income[country]["net"]
        start_time = "09:00"
        end_time = "17:00"
        onboard_date = date.today().replace(month=1, day=1).strftime("%Y-%m-%d")
    context = get_dashboard_context(country, state, gross, net, start_time, end_time, onboard_date)
    if context is None:
        return render_template("error.html", message="Invalid country code"), 400
    return render_template("index.html", **context)


def get_dashboard_context(country_code, state=None, gross=None, net=None, start_time=None, end_time=None, onboard_date=None):
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸", "currency": {"name": "USD", "symbol": "($)"}},
        "AU": {"name": "Australia", "flag": "🇦🇺", "currency": {"name": "AUD", "symbol": "(A$)"}},
        "DE": {"name": "Germany", "flag": "🇩🇪", "currency": {"name": "EUR", "symbol": "(€)"}},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧", "currency": {"name": "GBP", "symbol": "(£)"}},
        "CA": {"name": "Canada", "flag": "🇨🇦", "currency": {"name": "CAD", "symbol": "(C$)"}},
    }
    default_regions = {
        "US": "CA - California",
        "AU": "NSW - New South Wales",
        "DE": "NW - Nordrhein-Westfalen",
        "GB": "ENG - England",
        "CA": "ON - Ontario"
    }
    default_income = {
        "US": {"gross": 5000, "net": 4000},
        "AU": {"gross": 7000, "net": 5500},
        "DE": {"gross": 4500, "net": 3000},
        "GB": {"gross": 4800, "net": 3500},
        "CA": {"gross": 5200, "net": 4000}
    }
    today = date.today()
    country_code = country_code.upper()
    if country_code not in country_info:
        return None
    # 默认值
    state = state or default_regions[country_code]
    gross = gross or default_income[country_code]["gross"]
    net = net or default_income[country_code]["net"]
    start_time = start_time or "09:00"
    end_time = end_time or "17:00"
    if not onboard_date:
        onboard_date = today.replace(month=1, day=1).strftime("%Y-%m-%d")
    # 计算节假日和工作日
    holidays, working_days_current_month = get_holidays_in_month(country_code, extract_region_code(state))
    left_working_days = [day for day in working_days_current_month if day > today and day not in holidays]
    already_working_days = [day for day in working_days_current_month if day <= today and day not in holidays]
    gross_income_per_day = round(float(gross) / len(working_days_current_month), 2) if working_days_current_month else 0
    net_income_per_day = round(float(net) / len(working_days_current_month), 2) if working_days_current_month else 0
    gross_income_so_far = round(gross_income_per_day * len(already_working_days), 2) if working_days_current_month else 0
    net_income_so_far = round(net_income_per_day * len(already_working_days), 2) if working_days_current_month else 0
    # 工作时长
    try:
        start_hour, start_minute = map(int, start_time.split(":"))
        end_hour, end_minute = map(int, end_time.split(":"))
        daily_working_duration = (end_hour - start_hour) * 60 + (end_minute - start_minute)
    except Exception:
        daily_working_duration = 0
    now = pd.Timestamp.now()
    today_start_time = pd.Timestamp(now.year, now.month, now.day, start_hour if 'start_hour' in locals() else 9, start_minute if 'start_minute' in locals() else 0)
    worked_minutes = (now - today_start_time).total_seconds() / 60 if daily_working_duration else 0
    worked_percentage = (worked_minutes / daily_working_duration) * 100 if daily_working_duration else 0
    worked_hours = worked_minutes // 60 if daily_working_duration else 0
    hourly_gross_income = round(gross_income_per_day / (daily_working_duration / 60), 2) if daily_working_duration else 0
    hourly_net_income = round(net_income_per_day / (daily_working_duration / 60), 2) if daily_working_duration else 0
    gross_income_today = max(worked_hours * hourly_gross_income, gross_income_per_day) if daily_working_duration else 0
    net_income_today = max(worked_hours * hourly_net_income, net_income_per_day) if daily_working_duration else 0

    # 计算入职以来的工作日和累计收入
    onboard_days = 0
    total_gross_earnings = 0
    total_net_earnings = 0
    try:
        onboard_dt = pd.to_datetime(onboard_date).date()
        # 获取所有入职以来的工作日（不含节假日），分月计算
        all_working_days = []
        y, m = onboard_dt.year, onboard_dt.month
        while (y < today.year) or (y == today.year and m <= today.month):
            _, wds = get_holidays_in_specific_month(country_code, extract_region_code(state), y, m)
            for d in wds:
                if (d >= onboard_dt) and (d <= today):
                    all_working_days.append(d)
            # 下一个月
            if m == 12:
                y += 1
                m = 1
            else:
                m += 1
        onboard_days = len(all_working_days)
        # 以当前月的日薪为基准
        total_gross_earnings = round(gross_income_per_day * onboard_days, 2)
        total_net_earnings = round(net_income_per_day * onboard_days, 2)
    except Exception:
        onboard_days = 0
        total_gross_earnings = 0
        total_net_earnings = 0

    return dict(
        country_code=country_code,
        country_name=country_info[country_code]["name"],
        country_flag=country_info[country_code]["flag"],
        currency_symbol=country_info[country_code]["currency"]["symbol"],
        state=state,
        gross=gross,
        net=net,
        start_time=start_time,
        end_time=end_time,
        onboard_date=onboard_date,
        holidays=holidays,
        working_days_current_month=working_days_current_month,
        current_month=today.strftime("%B"),
        already_working_days=already_working_days,
        worked_minutes=worked_minutes,
        worked_percentage=worked_percentage,
        daily_working_duration=daily_working_duration,
        gross_income_today=gross_income_today,
        net_income_today=net_income_today,
        gross_income_so_far=gross_income_so_far,
        net_income_so_far=net_income_so_far,
        onboard_days=onboard_days,
        total_gross_earnings=total_gross_earnings,
        total_net_earnings=total_net_earnings
    )


if __name__ == "__main__":
    app.run(debug=True)

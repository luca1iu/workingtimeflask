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
    country = request.form.get("country")
    region = request.form.get("state")
    gross = float(request.form.get("gross_income", 0))
    net = float(request.form.get("net_income", 0))
    start_time = request.form.get("start_time")
    end_time = request.form.get("end_time")

    if request.method == "POST":
        print(
            f"Country: {country}, Region: {region}, Gross Income: {gross}, Net Income: {net}, Start Time: {start_time}, End Time: {end_time}")

    return render_template('index.html', country=country,
                           region=region,
                           gross=gross,
                           net=net,
                           start_time=start_time,
                           end_time=end_time)


def get_dashboard_context(country_code, state=None, gross=None, net=None, start_time=None, end_time=None):
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
        net_income_so_far=net_income_so_far
    )


@app.route("/<country_code>", methods=["GET", "POST"])
def country_dashboard(country_code):
    if request.method == "POST":
        state = request.form.get("state")
        gross = request.form.get("gross_income")
        net = request.form.get("net_income")
        start_time = request.form.get("start_time")
        end_time = request.form.get("end_time")
        context = get_dashboard_context(country_code, state, gross, net, start_time, end_time)
        if context is None:
            return render_template("error.html", message="Invalid country code"), 400
        return render_template("country.html", **context)
    # GET: 用默认值
    context = get_dashboard_context(country_code)
    if context is None:
        return render_template("error.html", message="Invalid country code"), 400
    return render_template("country.html", **context)


@app.route("/<country_code>/calculate", methods=["POST"])
def calculate(country_code):
    # 兼容老前端，直接复用
    state = request.form.get("state")
    gross = request.form.get("gross_income")
    net = request.form.get("net_income")
    start_time = request.form.get("start_time")
    end_time = request.form.get("end_time")
    context = get_dashboard_context(country_code, state, gross, net, start_time, end_time)
    if context is None:
        return render_template("error.html", message="Invalid country code"), 400
    return render_template("country.html", **context)


if __name__ == "__main__":
    app.run(debug=True)

from dateutil.utils import today

from app_functions import *

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

# # app_functions.py
# def get_state(country_code):
#     selected_region = extract_region_code(request.form.get("state"))
#     holidays_current_month, working_days_current_month = get_holidays_in_month(country_code, selected_region)
#     print("selected country code:", country_code, "selected region:", selected_region)
#     return holidays_current_month, working_days_current_month


@app.route("/", methods=["GET", "POST"])
def home():
    country = request.form.get("country")
    region = request.form.get("state")
    gross = float(request.form.get("gross_income", 0))
    net = float(request.form.get("net_income", 0))
    start_time = request.form.get("start_time")
    end_time = request.form.get("end_time")

    if request.method == "POST":
        print(f"Country: {country}, Region: {region}, Gross Income: {gross}, Net Income: {net}, Start Time: {start_time}, End Time: {end_time}")

    return render_template('index.html',country=country,
    region=region,
    gross=gross,
    net=net,
    start_time=start_time,
    end_time=end_time)


@app.route("/<country_code>", methods=["GET", "POST"])
def country_dashboard(country_code):
    print(f"Accessing country dashboard for: {country_code}")
    country_code = country_code.upper()
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸"},
        "AU": {"name": "Australia", "flag": "🇦🇺"},
        "DE": {"name": "Germany", "flag": "🇩🇪"},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧"},
        "CA": {"name": "Canada", "flag": "🇨🇦"},
    }
    today = date.today()

    # holidays_current_month, working_days_current_month = get_state(country_code)

    return render_template(
        "country.html",
        country_code=country_code,  # <-- 必须加这行
        country_name=country_info[country_code]["name"],
        country_flag=country_info[country_code]["flag"],
        current_month=today.strftime("%B")
        # holidays_this_month=holidays_current_month,
        # working_days_current_month=working_days_current_month
    )


if __name__ == "__main__":
    app.run(debug=True)
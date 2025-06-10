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


@app.route("/<country_code>", methods=["GET", "POST"])
def country_dashboard(country_code):
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸", "currency": {"name": "USD", "symbol": "($)"}},
        "AU": {"name": "Australia", "flag": "🇦🇺", "currency": {"name": "AUD", "symbol": "(A$)"}},
        "DE": {"name": "Germany", "flag": "🇩🇪", "currency": {"name": "EUR", "symbol": "(€)"}},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧", "currency": {"name": "GBP", "symbol": "(£)"}},
        "CA": {"name": "Canada", "flag": "🇨🇦", "currency": {"name": "CAD", "symbol": "(C$)"}},
    }
    today = date.today()
    country_code = country_code.upper()

    if country_code not in country_info:
        return render_template("error.html", message="Invalid country code"), 400

    if request.method == "POST":
        print("Received POST request for country:", country_code, "with form data:", request.form)
        # Optionally process POST data here if needed

    return render_template(
        "country.html",
        country_code=country_code,  # <-- 必须加这行
        country_name=country_info[country_code]["name"],
        country_flag=country_info[country_code]["flag"],
        currency_symbol=country_info[country_code]["currency"]["symbol"],
        current_month=today.strftime("%B")
    )


@app.route("/<country_code>/calculate", methods=["POST"])
def calculate(country_code):
    country_info = {
        "US": {"name": "United States", "flag": "🇺🇸", "currency": {"name": "USD", "symbol": "($)"}},
        "AU": {"name": "Australia", "flag": "🇦🇺", "currency": {"name": "AUD", "symbol": "(A$)"}},
        "DE": {"name": "Germany", "flag": "🇩🇪", "currency": {"name": "EUR", "symbol": "(€)"}},
        "GB": {"name": "United Kingdom", "flag": "🇬🇧", "currency": {"name": "GBP", "symbol": "(£)"}},
        "CA": {"name": "Canada", "flag": "🇨🇦", "currency": {"name": "CAD", "symbol": "(C$)"}},
    }
    today = date.today()
    country_code = country_code.upper()

    if country_code not in country_info:
        return render_template("error.html", message="Invalid country code"), 400


    # Get and validate form data
    state = request.form.get("state")
    gross = request.form.get("gross_income")
    net = request.form.get("net_income")
    start_time = request.form.get("start_time")
    end_time = request.form.get("end_time")

    # Basic validation
    errors = []
    if not state:
        errors.append("State/Region is required.")
    if not gross or not gross.replace(".", "").isdigit():
        errors.append("Gross income must be a valid number.")
    if not net or not net.replace(".", "").isdigit():
        errors.append("Net income must be a valid number.")
    if not start_time or not end_time:
        errors.append("Start and end times are required.")

    if errors:
        return render_template(
            "country.html",
            country_code=country_code,
            country_name=country_info[country_code]["name"],
            country_flag=country_info[country_code]["flag"],
            currency_symbol=country_info[country_code]["currency"]["symbol"],
            current_month=today.strftime("%B"),
            state=state,
            gross=gross,
            net=net,
            start_time=start_time,
            end_time=end_time,
            errors=errors
        )

    print(f"Received calculation request: {country_code}, {state}, {gross}, {net}, {start_time}, {end_time}")

    # Fetch holidays (assuming /get_holidays endpoint exists)
    holidays, working_days_current_month = get_holidays_in_month(country_code, extract_region_code(state))
    left_working_days = [day for day in working_days_current_month if day > today and day not in holidays]
    already_working_days = [day for day in working_days_current_month if day <= today and day not in holidays]
    gross_income_per_day = gross / len(working_days_current_month)
    net_income_per_day = net / len(working_days_current_month)

    print(f"Holidays for {country_code} in {state}: {holidays}")
    print(len(working_days_current_month))
    print(len(left_working_days))
    print(len(already_working_days))

    # calculate how many working days left in the month

    return render_template(
        "country.html",
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
        working_days_current_month = working_days_current_month,
        current_month=today.strftime("%B")
    )


if __name__ == "__main__":
    app.run(debug=True)

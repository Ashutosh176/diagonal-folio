import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SITE } from '../config.js';
import { Media } from '../components/Img.jsx';
import Field from '../components/Field.jsx';

const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

const STEPS = [
  ['01', 'Request', 'Choose in person or video, and a day that suits you.'],
  ['02', 'Confirm', 'A client advisor confirms the time by email within one working day.'],
  ['03', 'Meet', 'Every colourway of your piece, with personalisation to try.'],
];

export default function Appointments() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', mode: 'in-person', city: '', date: '', time: 'Morning',
    interest: params.get('interest') || 'taglio', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setMode = (mode) => setForm((f) => ({ ...f, mode }));

  async function submit(e) {
    e.preventDefault();
    setStatus('busy');
    setErrors({});
    try {
      await api('/appointments', { method: 'POST', body: form });
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrors(err.fields || {});
      setMessage(err.message);
      setStatus('error');
    }
  }

  const visual = { cadre: 'cadre-cg-07-mood', orlo: 'orlo-in-07-mood', lama: 'lama-tp-07-mood', piega: 'piega-bx-07-mood', fibbia: 'fibbia-mi-07-mood' }[form.interest] || 'taglio-nc-07-mood';

  return (
    <section className="appt">
      <div className="appt__visual">
        <Media key={visual} name={visual} alt="" ratio="" sizes="(max-width: 900px) 100vw, 48vw" priority dark />
        <div className="appt__caption">
          <div className="eyebrow eyebrow--light">By appointment</div>
          <p className="display" style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', marginTop: 14 }}>In person, <em>or on a video call.</em></p>
        </div>
      </div>

      <div className="appt__content">
        <div className="eyebrow">Private appointments</div>
        <h1 className="display d-lg" style={{ marginTop: 20 }}>See it, hold it,<br /><em>then decide.</em></h1>
        <p className="lede" style={{ marginTop: 24, maxWidth: 480 }}>
          Meet a client advisor at a time that suits you. We’ll bring every colourway of the piece you’re considering, and you can try personalisation before you choose.
        </p>

        <ol className="appt__steps">
          {STEPS.map(([n, t, d]) => (
            <li key={n}>
              <span className="appt__num">{n}</span>
              <div><h3>{t}</h3><p>{d}</p></div>
            </li>
          ))}
        </ol>

        {status === 'done' ? (
          <div className="appt__done" role="status">
            <img src="/brand/DF_monogram_noir.svg" alt="" width="44" height="44" />
            <h2 className="display d-sm" style={{ marginTop: 24 }}>Thank you, {form.name.split(' ')[0]}.</h2>
            <p className="lede" style={{ marginTop: 16 }}>
              We’ve received your request for a {form.mode === 'video' ? 'video call' : 'meeting in person'}
              {form.date ? ` on ${new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}` : ''}, {form.time.toLowerCase()}.
              A client advisor will confirm the time by email within one working day.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="appt__form">
            {status === 'error' && <p className="notice notice--error" role="alert" style={{ marginBottom: 32 }}>{message}</p>}

            <fieldset>
              <legend>01 &nbsp; How would you like to meet?</legend>
              <div className="appt__modes">
                <label className="option"><input type="radio" name="mode" checked={form.mode === 'in-person'} onChange={() => setMode('in-person')} /><span className="option__label">In person</span><span className="option__aside">With a client advisor</span></label>
                <label className="option"><input type="radio" name="mode" checked={form.mode === 'video'} onChange={() => setMode('video')} /><span className="option__label">Video call</span><span className="option__aside">From anywhere in India</span></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>02 &nbsp; When</legend>
              <div className="form-grid">
                <Field label="Preferred date" type="date" min={tomorrow()} value={form.date} onChange={set('date')} error={errors.date} />
                <Field as="select" label="Time of day" value={form.time} onChange={set('time')}>
                  <option>Morning</option><option>Afternoon</option><option>Evening</option>
                </Field>
                {form.mode === 'in-person' && <Field className="full" label="City" autoComplete="address-level2" value={form.city} onChange={set('city')} />}
                <Field as="select" className="full" label="I’m interested in" value={form.interest} onChange={set('interest')}>
                  <option value="taglio">Taglio · DF-01 convertible briefcase</option>
                  <option value="cadre">Cadre · DF-02 frame bag</option>
                  <option value="orlo">Orlo · DF-03 top-handle bag</option>
                  <option value="lama">Lama · DF-04 ladies’ top-handle bag</option>
                  <option value="piega">Piega · DF-05 structured tote</option>
                  <option value="fibbia">Fibbia · DF-06 weekender</option>
                  <option value="personalisation">Personalisation</option>
                  <option value="gifting">A gift</option>
                  <option value="undecided">I’m not sure yet</option>
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>03 &nbsp; Your details</legend>
              <div className="form-grid">
                <Field className="full" label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
                <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
                <Field label="Mobile (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
                <Field as="textarea" className="full" label="Anything we should know (optional)" value={form.notes} onChange={set('notes')} />
              </div>
            </fieldset>

            <div>
              <button type="submit" className="btn" disabled={status === 'busy'}>
                {status === 'busy' ? <span className="spinner" /> : 'Request an appointment'}
              </button>
              <p className="small muted" style={{ margin: '16px 0 0', fontSize: 12 }}>
                Complimentary and without obligation. {SITE.hours}.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

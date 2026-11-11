import React from 'react';

// LostUpdate is a timeline of two requests touching one row. The results are what
// GORM v1.31, Bun v1.3, and ant left in PostgreSQL when this was run.
export default function LostUpdate() {
  return (
    <figure className="lost" aria-label="Two requests changing one row">
      <div className="lost__grid">
        <div className="lost__who">Request A</div>
        <div className="lost__step" style={{gridColumn: 2}}>
          <strong>Loads the user</strong>
          <span>Ada, plan free</span>
        </div>
        <div className="lost__step lost__step--save" style={{gridColumn: 4}}>
          <strong>Fixes the name, saves</strong>
          <span>Ada L.</span>
        </div>

        <div className="lost__who">Request B</div>
        <div className="lost__step" style={{gridColumn: 3}}>
          <strong>Upgrades the plan</strong>
          <span>plan pro</span>
        </div>
      </div>

      <div className="lost__results">
        <div className="lost__result is-wrong">
          <span>Saving the whole row</span>
          <code>name = "Ada L.", plan = "free"</code>
          <em>The upgrade is gone. No error was reported.</em>
        </div>
        <div className="lost__result is-right">
          <span>Saving what changed</span>
          <code>name = "Ada L.", plan = "pro"</code>
          <em>Both changes survive.</em>
        </div>
      </div>
    </figure>
  );
}
